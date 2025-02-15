import "@moonbeam-network/api-augment";
import {
  alith,
  ALITH_ADDRESS,
  BALTATHAR_SESSION_ADDRESS,
  CHARLETH_SESSION_ADDRESS,
  DEFAULT_GENESIS_BALANCE,
  DEFAULT_GENESIS_MAPPING,
} from "@moonwall/util";
import { expect, describeSuite, beforeAll } from "@moonwall/cli";
import { ApiPromise } from "@polkadot/api";
import { getMappingInfo } from "../../../helpers/common.js";

describeSuite({
  id: "D0201",
  title: "Author Mapping - double registration",
  foundationMethods: "dev",
  testCases: ({ context, log, it }) => {
    let api: ApiPromise;

    beforeAll(async () => {
      api = context.polkadotJs();
    });

    it({
      id: "T01",
      title: "should succeed in adding an association for bob",
      test: async function () {
        // How much fee does it consume the extrinsic
        const fee = (
          await api.tx.authorMapping.addAssociation(BALTATHAR_SESSION_ADDRESS).paymentInfo(alith)
        ).partialFee.toBigInt();

        await context.createBlock(api.tx.authorMapping.addAssociation(BALTATHAR_SESSION_ADDRESS));
        expect((await getMappingInfo(context, BALTATHAR_SESSION_ADDRESS))!.account).to.eq(
          alith.address
        );
        const expectedReservedBalance = 2n * DEFAULT_GENESIS_MAPPING;
        expect((await api.query.system.account(ALITH_ADDRESS)).data.free.toBigInt()).to.eq(
          DEFAULT_GENESIS_BALANCE - expectedReservedBalance - fee
        );
        expect((await api.query.system.account(ALITH_ADDRESS)).data.reserved.toBigInt()).to.eq(
          expectedReservedBalance
        );
      },
    });

    it({
      id: "T02",
      title: "should associate with charlie, although already associated with bob",
      test: async function () {
        // Grab free balance before this test
        let genesisAccountBalanceBefore = (
          await api.query.system.account(ALITH_ADDRESS)
        ).data.free.toBigInt();
        const fee = (
          await api.tx.authorMapping.addAssociation(CHARLETH_SESSION_ADDRESS).paymentInfo(alith)
        ).partialFee.toBigInt();
        await context.createBlock(api.tx.authorMapping.addAssociation(CHARLETH_SESSION_ADDRESS));
        //check that both are registered
        expect((await getMappingInfo(context, CHARLETH_SESSION_ADDRESS))?.account).to.eq(
          alith.address
        );
        expect((await getMappingInfo(context, BALTATHAR_SESSION_ADDRESS))?.account).to.eq(
          alith.address
        );
        const expectedReservedBalance = 3n * DEFAULT_GENESIS_MAPPING;
        expect((await api.query.system.account(ALITH_ADDRESS)).data.free.toBigInt()).to.eq(
          genesisAccountBalanceBefore - DEFAULT_GENESIS_MAPPING - fee
        );
        expect((await api.query.system.account(ALITH_ADDRESS)).data.reserved.toBigInt()).to.eq(
          expectedReservedBalance
        );
      },
    });
  },
});
