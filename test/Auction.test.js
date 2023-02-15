const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber, utils } = require('ethers')

describe('Auction', function () {
  const fixture = async () => {
    const [owner, addr1, addr2] = await ethers.getSigners()

    const Auction = await ethers.getContractFactory('Auction')
    const auction = await Auction.deploy()

    return { auction, owner, addr1, addr2 }
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { auction, owner } = await loadFixture(fixture)

      expect(await auction.owner()).to.equal(owner.address)
    })
  })

  describe('Initialization', function () {
    it('Should initialize the auction of 1 item with the right params', async function () {
      const { auction } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])

      const addedItems = await auction.items(1)

      expect(addedItems.startingBid).to.equal(
        BigNumber.from(utils.parseEther('2'))
      )
      expect(addedItems.highestBidder).to.equal(
        '0x0000000000000000000000000000000000000000'
      )
      expect(addedItems.ended).to.equal(false)
    })
    it('Should initialize the auction of several items with the right params', async function () {
      const { auction } = await loadFixture(fixture)
      await auction.initializeAuction(
        [1, 2],
        [utils.parseEther('2'), utils.parseEther('4')]
      )

      const addedItems = await auction.items(2)

      expect(addedItems.startingBid).to.equal(
        BigNumber.from(utils.parseEther('4'))
      )
      expect(addedItems.highestBidder).to.equal(
        '0x0000000000000000000000000000000000000000'
      )
      expect(addedItems.ended).to.equal(false)
    })
    it('Should fail to initialize if params length is not equal', async function () {
      const { auction } = await loadFixture(fixture)

      await expect(
        auction.initializeAuction([1, 2], [2000])
      ).to.be.revertedWith('Invalid input length')

      await expect(
        auction.initializeAuction([1, 2], [2000, 0, 0])
      ).to.be.revertedWith('Invalid input length')
    })
    it('Should fail to initialize if same auction ID is used', async function () {
      const { auction } = await loadFixture(fixture)

      await expect(
        auction.initializeAuction([1, 1], [2000, 2002])
      ).to.be.revertedWith('Item already exists')
    })
  })
  describe('Place bid', function () {
    it('Should place a bid', async function () {
      const { auction, addr1 } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await auction.connect(addr1).placeBid(1, {
        value: utils.parseEther('2.1'),
      })

      const item = await auction.items(1)

      expect(item.highestBidder).to.equal(addr1.address)
      expect(item.highestBid).to.equal(BigNumber.from(utils.parseEther('2.1')))
    })
    it('Should NOT place a bid lower than starting bid', async function () {
      const { auction, addr1 } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await expect(
        auction.connect(addr1).placeBid(1, {
          value: utils.parseEther('1.9'),
        })
      ).to.be.revertedWith('Bid lower than starting bid')
    })
    it('Should NOT place a bid lower than highest bid', async function () {
      const { auction, addr1 } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await auction.connect(addr1).placeBid(1, {
        value: utils.parseEther('4'),
      })
      await expect(
        auction.connect(addr1).placeBid(1, {
          value: utils.parseEther('3'),
        })
      ).to.be.revertedWith('Bid lower than highest bid')
    })
    it('Should return previous bid when higher bid has been placed', async function () {
      const { auction, addr1, addr2 } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await auction.connect(addr1).placeBid(1, {
        value: utils.parseEther('3'),
      })
      await auction.connect(addr2).placeBid(1, {
        value: utils.parseEther('5'),
      })
      expect(await auction.provider.getBalance(auction.address)).to.equal(
        BigNumber.from(utils.parseEther('5'))
      )
    })
    it('Should NOT allow the owner to place a bid', async function () {
      const { auction } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await expect(
        auction.placeBid(1, {
          value: utils.parseEther('3'),
        })
      ).to.be.revertedWith('Not owner allowed')
    })
  })
  describe.only('Higest bidder, end auction and withdraw', function () {
    it('Should end the auction', async function () {
      const { auction } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await auction.endAuction(1)

      const endedAuction = await auction.items(1)

      expect(endedAuction.ended).to.equal(true)
    })
    it('Should return highest bidder after the auction has ended', async function () {
      const { auction, addr2 } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await auction.connect(addr2).placeBid(1, {
        value: utils.parseEther('5'),
      })
      await auction.endAuction(1)

      expect(await auction.highestBidder(1)).to.equal(addr2.address)
    })
    it('Should NOT return highest bidder before the auction has ended', async function () {
      const { auction } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])

      await expect(auction.highestBidder(1)).to.be.revertedWith(
        'Auction not ended yet'
      )
    })
    it('Should NOT run end the auction when non initialize', async function () {
      const { auction } = await loadFixture(fixture)
      await expect(auction.endAuction(1)).to.be.revertedWith(
        'Auction not initialized'
      )
    })
    it('Should ONLY end the auction when owner makes the tx', async function () {
      const { auction, addr1 } = await loadFixture(fixture)
      await expect(auction.connect(addr1).endAuction(1)).to.be.revertedWith(
        'Only the owner is allowed'
      )
    })
    it('Should NOT withdraw funds when owner makes the tx', async function () {
      const { auction, addr1 } = await loadFixture(fixture)
      await expect(auction.connect(addr1).withdraw()).to.be.revertedWith(
        'Only the owner is allowed'
      )
    })
    it('Should withdraw funds when owner makes the tx', async function () {
      const { auction, addr1 } = await loadFixture(fixture)
      await auction.initializeAuction([1], [utils.parseEther('2')])
      await auction.connect(addr1).placeBid(1, {
        value: utils.parseEther('5'),
      })

      expect(await auction.provider.getBalance(auction.address)).to.equal(
        BigNumber.from(utils.parseEther('5'))
      )

      await auction.withdraw()

      expect(await auction.provider.getBalance(auction.address)).to.equal(
        BigNumber.from(utils.parseEther('0'))
      )
    })
  })
})
