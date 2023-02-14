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
  describe.only('Place bid', function () {
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
  })
  // it.only('Should set to true ended property after a week has passed', async function () {
  //   const { auction, owner } = await loadFixture(fixture)

  //   await auction.initializeAuction([1], [2000])

  //   await time.increase(3600 * 24 * 8)
  //   console.log(await time.latest())

  //   const addedItems = await auction.items(1)

  //   console.log(addedItems)

  //   expect(addedItems.ended).to.equal(true)
  // })
})
