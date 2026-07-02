#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
    echo "Usage: $0 firefox.csv chrome.csv"
    exit 1
fi

input="$1"
output="$2"

awk -F',' '
BEGIN {
    OFS=","
}

NR==1 {
    for (i=1; i<=NF; i++) {
        gsub(/^"|"$/, "", $i)

        if ($i=="url") url=i
        else if ($i=="username") user=i
        else if ($i=="password") pass=i
    }

    print "name,url,username,password,note"
    next
}

{
    for (i=1; i<=NF; i++)
        gsub(/^"|"$/, "", $i)

    name=$url
    sub(/^https?:\/\//,"",name)
    sub(/^www\./,"",name)
    sub(/\/.*$/,"",name)

    print name,$url,$user,$pass,""
}
' "$input" > "$output"

echo "Done: $output"
