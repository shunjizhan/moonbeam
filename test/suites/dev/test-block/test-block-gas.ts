import "@moonbeam-network/api-augment";
import {
  TransactionTypes,
  describeSuite,
  expect,
  deployCreateCompiledContract,
  fetchCompiledContract,
} from "@moonwall/cli";
import { EXTRINSIC_GAS_LIMIT } from "@moonwall/util";

describeSuite({
  id: "D0403",
  title: "Block creation - suite 2",
  foundationMethods: "dev",
  testCases: ({ context, it, log }) => {
    for (const txnType of TransactionTypes) {
      it({
        id: `T0${TransactionTypes.indexOf(txnType) + 1}`,
        title: `${txnType} should be allowed to the max block gas`,
        test: async function () {
          const { hash, status } = await deployCreateCompiledContract(context, "MultiplyBy7", {
            gas: EXTRINSIC_GAS_LIMIT,
          });
          expect(status).toBe("success");
          const receipt = await context.viem("public").getTransactionReceipt({ hash });
          expect(receipt.blockHash).toBeTruthy();
        },
      });

      it({
        id: `T0${TransactionTypes.indexOf(txnType) * 2 + 1}`,
        title: `${txnType} should fail setting it over the max block gas`,
        test: async function () {
          expect(
            async () =>
              await deployCreateCompiledContract(context, "MultiplyBy7", {
                gas: EXTRINSIC_GAS_LIMIT + 1n,
              }),
            "Transaction should be reverted but instead contract deployed"
          ).rejects.toThrowError("exceeds block gas limit");
        },
      });
    }

    it({
      id: "T07",
      title: "should be accessible within a contract",
      test: async function () {
        const { contract, contractAddress } = await deployCreateCompiledContract(
          context,
          "BlockVariables"
        );
        expect(await contract.read.getGasLimit([])).to.equal(15000000n);

        const { abi } = await fetchCompiledContract("BlockVariables");
        expect(
          await context.viem("public").readContract({
            address: contractAddress!,
            abi,
            args: [],
            functionName: "getGasLimit",
          })
        ).to.equal(15000000n);
      },
    });
  },
});
