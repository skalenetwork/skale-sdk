#!/usr/bin/env bash

for (( i=0 ; $i<20 ; i=(($i+1)) ))
do
  echo Running cats batch № $i
  node cat-cycle.js $i &
done