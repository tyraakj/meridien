import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  type Address,
  type Hash,
} from "viem";
import { hardhat } from "viem/chains";

// Contract Addresses (Configurable from environment)
export const CONTRACT_ADDRESSES = {
  PROJECT_REGISTRY: (process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3") as Address,
  BLUE_CARBON_TOKEN: (process.env.NEXT_PUBLIC_BLUE_CARBON_TOKEN_ADDRESS ||
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0") as Address,
  MRV_RECORD: (process.env.NEXT_PUBLIC_MRV_RECORD_ADDRESS ||
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as Address,
};

// Contract ABIs
export const BLUE_CARBON_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "beneficiary", type: "string" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "retire",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalCarbonRetired",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const MRV_RECORD_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "reportId", type: "uint256" }],
    name: "approveReport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "reportId", type: "uint256" }],
    name: "getReport",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "reportId", type: "uint256" },
          { internalType: "uint256", name: "projectId", type: "uint256" },
          { internalType: "address", name: "surveyor", type: "address" },
          { internalType: "string", name: "ipfsBundleCID", type: "string" },
          { internalType: "bytes32", name: "bundleHash", type: "bytes32" },
          { internalType: "uint256", name: "carbonTonsScaled", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint256", name: "approvalCount", type: "uint256" },
          { internalType: "uint256", name: "submittedAt", type: "uint256" },
        ],
        internalType: "struct MRVRecord.MRVReport",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
});

export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No Web3 wallet provider detected in browser");
  }
  return createWalletClient({
    chain: hardhat,
    transport: custom(window.ethereum),
  });
}

/**
 * Retires (burns) verified Blue Carbon Tokens on-chain.
 */
export async function retireCreditsOnChain(
  amountTokens: string,
  beneficiary: string,
  reason: string
): Promise<Hash> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No wallet account connected");

  const amountScaled = parseEther(amountTokens);

  return await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.BLUE_CARBON_TOKEN,
    abi: BLUE_CARBON_TOKEN_ABI,
    functionName: "retire",
    args: [amountScaled, beneficiary, reason],
    account,
  });
}

/**
 * Casts a verifier approval vote on an MRV report on-chain.
 */
export async function approveReportOnChain(onchainReportId: number): Promise<Hash> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No wallet account connected");

  return await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.MRV_RECORD,
    abi: MRV_RECORD_ABI,
    functionName: "approveReport",
    args: [BigInt(onchainReportId)],
    account,
  });
}

/**
 * Fetches user's BCT balance.
 */
export async function fetchUserBCTBalance(userAddress: Address): Promise<string> {
  try {
    const rawBalance = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BLUE_CARBON_TOKEN,
      abi: BLUE_CARBON_TOKEN_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });
    return formatEther(rawBalance);
  } catch (err) {
    console.warn("Failed to read on-chain BCT balance:", err);
    return "0.00";
  }
}
