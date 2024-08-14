
#!/bin/bash

declare -A url
url[house]=https://data.taipei/api/v1/dataset/93d9bc2d-af08-4db7-a56b-9f0a49226fa3?scope=resourceAquire
url[bike]=https://data.taipei/api/v1/dataset/adf80a2b-b29d-4fca-888c-bcd26ae314e0?scope=resourceAquire
url[car]=https://data.taipei/api/v1/dataset/967faed7-ea9b-4698-970a-d335d5e4ccc3?scope=resourceAquire
url[cycle]=https://data.taipei/api/v1/dataset/ac508aeb-9f26-409c-9fb0-20c65a973498?scope=resourceAquire


fetch_data() {
    local type=$1
    local limit=$2
    local offset=$3
    
    if [[ -z "${url[$type]}" ]]; then
        echo "Error: Invalid type specified" >&2
        return 1
    fi
    
    response=$(curl -s "${url[$type]}&limit=$limit&offset=$offset")
    
    echo "$response"
}

for type in "${!url[@]}"; do
    count=$(fetch_data "$type" 1 0 | jq '.result.count')
    mkdir -p "../data/$type"
    offset=0
    while [ $offset -lt $count ]; do
        fetch_data "$type" 1000 $offset | jq '.result.results' > "../data/$type/${type}_data_${offset}.json"
        offset=$((offset + 1000))
    done
done

