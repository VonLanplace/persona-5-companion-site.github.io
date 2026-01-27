#!/bin/bash

input="questions.csv"
output="questions2.csv"

# Verifica se o arquivo de entrada existe
if [[ ! -f "$input" ]]; then
  echo "Arquivo $input não encontrado."
  exit 1
fi

# Substitui vírgulas por ponto e vírgula
sed 's/,/;/g' "$input" > "$output"

echo "Conversão concluída: $output criado com sucesso."
