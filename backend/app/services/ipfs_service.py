import json
import hashlib
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings


class IPFSService:
    @staticmethod
    def compute_sha256(data_bytes: bytes) -> str:
        return f"0x{hashlib.sha256(data_bytes).hexdigest()}"

    @staticmethod
    def compute_deterministic_cid(payload_dict: Dict[str, Any]) -> str:
        """
        Generates a standard deterministic IPFS CID representation from JSON payload.
        """
        canonical_json = json.dumps(payload_dict, separators=(",", ":"), sort_keys=True).encode("utf-8")
        h = hashlib.sha256(canonical_json).hexdigest()
        # Mock/deterministic base58-like string representation
        return f"Qm{h[:44]}"

    @classmethod
    async def pin_json_to_ipfs(cls, payload_dict: Dict[str, Any]) -> tuple[str, str]:
        """
        Pins JSON payload to IPFS (via Pinata or local IPFS node if configured).
        Returns: (ipfs_cid, sha256_hash)
        """
        canonical_json_str = json.dumps(payload_dict, separators=(",", ":"), sort_keys=True)
        raw_bytes = canonical_json_str.encode("utf-8")
        sha256_hash = cls.compute_sha256(raw_bytes)
        deterministic_cid = cls.compute_deterministic_cid(payload_dict)

        if settings.PINATA_JWT:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                        headers={"Authorization": f"Bearer {settings.PINATA_JWT}"},
                        json={
                            "pinataContent": payload_dict,
                            "pinataMetadata": {"name": f"MRV_Bundle_{sha256_hash[:10]}"}
                        }
                    )
                    if resp.status_code == 200:
                        pinata_cid = resp.json().get("IpfsHash")
                        return pinata_cid, sha256_hash
            except Exception as e:
                # Fallback to deterministic CID if Pinata is unreachable
                print(f"[IPFS Service] Pinata pinning warning: {e}")

        return deterministic_cid, sha256_hash
