const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber, utils } = require('ethers')

describe.only('Attack', function () {
  const fixture = async () => {
    const [owner, addr1, addr2] = await ethers.getSigners()

    const Auction = await ethers.getContractFactory('Auction')
    const auction = await Auction.deploy()

    await auction.initializeAuction([1], [utils.parseEther('2')])
    await auction.initializeAuction([2], [utils.parseEther('200')])

    await auction.connect(addr1).placeBid(2, {
      value: utils.parseEther('450'),
    })

    const Attack = await ethers.getContractFactory('Attack')
    const attack = await Attack.deploy(auction.address)

    await attack.setItemId(1)
    await attack.placeBid({
      value: utils.parseEther('2.1'),
    })

    await attack.fund({
      value: utils.parseEther('20'),
    })
    return { auction, attack, owner, addr1, addr2 }
  }

  describe('Set up', function () {
    it('Should place bid twice', async function () {
      const { attack, auction } = await loadFixture(fixture)
      expect(await attack.itemId()).to.equal(1)
      expect(await auction.provider.getBalance(auction.address)).to.equal(
        BigNumber.from(utils.parseEther('452.1'))
      )
      expect(await attack.provider.getBalance(attack.address)).to.equal(
        BigNumber.from(utils.parseEther('20'))
      )

      const item1 = await auction.items(1)

      expect(item1.highestBidder).to.equal(attack.address)

      await attack.placeBid({
        value: utils.parseEther('2.2'),
      })

      expect(await auction.provider.getBalance(auction.address)).to.equal(
        BigNumber.from(utils.parseEther('452.1'))
      )
      // const itemsSlot = await auction.items(1)
      // const initializedSlot = await auction.itemInitialized(1)

      // console.log('items mapping slot:', itemsSlot)
      // console.log(
      //   'itemInitialized mapping slot:',
      //   utils.hexValue(initializedSlot)
      // )
    })
    it('Should place bid twice 2', async function () {
      const { attack, auction } = await loadFixture(fixture)
    })
  })
})
