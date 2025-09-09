#!/bin/zsh

# Usage: ./extract_between.zsh filename "BEGIN" "END"

##if [[ $# -lt 3 ]]; then
#  echo "Usage: $0 <filename> <begin_marker> <end_marker>"
## exit 1
#fi

#filename=$1
#begin=$2
#end=$3
#awk '/<link rel="stylesheet" href="/{flag=1; next} /" />/{flag=0} flag {print}' | tr '\n' ' '
 


filename="./src/battleseek.html"
begin='<link rel=\"stylesheet\" href=\"'
end='\" />'

prefix='./src/' 
 


# Extract text between markers on the same line
cssfiles=()
while IFS= read -r line; do
  if [[ "$line" =~ $begin(.*)$end ]]; then
      cssfiles+=("${prefix}${match[1]}") 
  fi
done < "$filename"

# Print space-separated
#echo "${(j: :)result}"
styles="${(j: :)cssfiles}"
echo $styles


 
begin2='type=\"module\" src=\"./'
end2='\"></script>'

# Extract text between markers on the same line
jsfiles=()
while IFS= read -r line; do
  if [[ "$line" =~ $begin2(.*)$end2 ]]; then

      jsfiles+=("${prefix}${match[1]}") 
  fi
done < "$filename"

# Print space-separated
#echo "${(j: :)result}"
scripts="${(j: :)jsfiles}"
echo $scripts

 
for f in $cssfiles; do
  echo ""
  echo "/* ----- $f ----- */"
  echo ""
  cat "$f"
done > ./dist/style.css


 
for f in $jsfiles; do
  echo ""
  echo "/* ----- $f ----- */"
  echo ""
  cat "$f"
done > ./dist/script.js