import asyncio
import json
import multiprocessing
import signal
from functools import partial
from multiprocessing import Lock
from time import time
from typing import List, Literal, Tuple, TypedDict

import httpx
import pandas as pd
from geojson import Feature, FeatureCollection, Point
from rich import print
from tqdm import tqdm

# df = pd.read_csv("../data/bike.csv")


type DataType = Literal["bike", "house", "car", "cycle"]


class Property(TypedDict):
    type: DataType
    date: str
    time: str
    address: str


fail_cases = []


def parse_csv(data_type: str):
    import json
    from pathlib import Path

    import pandas as pd

    DATA_PATH = Path("../data")

    df: pd.DataFrame | None = None

    for fp in DATA_PATH.glob(f"{data_type}/*.json"):
        new_df = pd.DataFrame(json.loads(fp.read_bytes()))
        if df is None:
            df = new_df
        else:
            df = pd.concat([df, new_df], ignore_index=True)

    assert df is not None
    df = df.drop(["_id", "_importdate"], axis=1, errors="ignore")
    df = df.set_index("編號")
    df.to_csv(DATA_PATH / f"{data_type}_data.csv")
    return df


lock = Lock()


async def get_geo_feature(
    row: pd.Series,
    client: httpx.AsyncClient,
    data_type: DataType,
    pbar: tqdm | None = None,
):
    address = row["發生地點"]

    base_url = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
    params = {
        "SingleLine": address,
        "f": "json",
        "outSR": '{"wkid":4326}',
        # "outFields": "Addr_type,Match_addr,StAddr,City",
        "maxLocations": 6,
    }

    try:
        response = await client.get(base_url, params=params)

        if pbar:
            pbar.update(1)
        point = response.json()["candidates"][0]["location"]
        return Feature(
            geometry=Point((point["x"], point["y"])),
            properties=Property(
                type=data_type,
                date=str(row["發生日期"]),
                time=str(row["發生時段"]),
                address=str(row["發生地點"]),
            ),
        )
    except:
        if pbar:
            pbar.update(1)
        fail_cases.append(row)
        return None


# Example usage:
# result = geocode_address("臺北市大安區住安里四維路124巷1~30號")


async def process_async(df: pd.DataFrame, data_type: DataType, pbar: tqdm) -> List[Feature]:
    batch_size = 100
    limits = httpx.Limits(max_connections=10)
    timeout = httpx.Timeout(10.0, connect=10.0)

    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        tasks = [
            get_geo_feature(row, client, data_type, pbar) for _, row in df.iterrows()
        ]
        results: List[Feature] = []
        for i in range(0, len(tasks), batch_size):
            results += [
                res
                for res in await asyncio.gather(*tasks[i : i + batch_size])
                if res is not None
            ]
    return results

def main(data_type: DataType, df: pd.DataFrame) -> None:
    pbar = tqdm(total=len(df), desc=f"Processing {data_type}")

    results: List[Feature] = asyncio.run(process_async(df, data_type, pbar))

    pbar.close()

    feature_collection = FeatureCollection(results)

    with open(f"../data/{data_type}_geo.json", "w") as f:
        json.dump(feature_collection, f, ensure_ascii=False)


if __name__ == "__main__":
    # data_types: Tuple[str, ...] = ("bike", "house", "car", "cycle")
    data_types: Tuple[str, ...] = ("house", "car", "cycle")
    for data_type in data_types:
        df: pd.DataFrame = parse_csv(data_type)

        st: float = time()
        main(data_type, df)
        print(f"Time taken for {data_type}: {time() - st}")
        pd.DataFrame(fail_cases).to_csv(f"../data/{data_type}_fail.csv", index=False)
        fail_cases.clear()  # Clear fail_cases for the next data type
