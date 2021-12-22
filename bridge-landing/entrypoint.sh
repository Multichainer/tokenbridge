#!/bin/bash 

ENV_FILE="/root/.env"
source ${ENV_FILE}
LINES="cat ${ENV_FILE} | wc -l"
for i in $(seq 1 1 ${LINES})
do
   var="BR${i}"
   cat "${!var}"
   sed -i 's/#BR${i}/${!var}/g' /usr/share/nginx/html/index.html
done
