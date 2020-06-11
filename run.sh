#!/usr/bin/env bash

# skale-dev-env

# @file run.sh
# @copyright SKALE Labs 2019-Present

# Based on Bash Boilerplate: https://github.com/xwmx/bash-boilerplate
# Copyright (c) 2015 William Melody • hi@williammelody.com

###############################################################################
# Tunable parameters
###############################################################################

_USE_DEBUG=0
_SKALED_IMAGE="skalenetwork/schain:1.46-develop.17"
_DATA_DIR="./data_dir"

###############################################################################
# Interpreter Settings
###############################################################################

# Short form: set -u
set -o nounset

# Short form: set -e
set -o errexit

# Print a helpful message if a pipeline with non-zero exit code causes the
# script to exit as described above.
trap 'echo "Aborting due to errexit on line $LINENO. Exit code: $?" >&2' ERR

# Allow the above trap be inherited by all functions in the script.
# Short form: set -E
set -o errtrace

# Return value of a pipeline is the value of the last (rightmost) command to
# exit with a non-zero status, or zero if all commands in the pipeline exit
# successfully.
set -o pipefail

# Set $IFS to only newline and tab.
# http://www.dwheeler.com/essays/filenames-in-shell.html
IFS=$'\n\t'

###############################################################################
# Environment
###############################################################################

# $_ME
#
# Set to the program's basename.
_ME=$(basename "${0}")

###############################################################################
# Debug
###############################################################################

# _debug()
#
# Usage:
#   _debug printf "Debug info. Variable: %s\n" "$0"
#
# A simple function for executing a specified command if the `$_USE_DEBUG`
# variable has been set. The command is expected to print a message and
# should typically be either `echo`, `printf`, or `cat`.
__DEBUG_COUNTER=0
_debug() {
  if [[ "${_USE_DEBUG:-"0"}" -eq 1 ]]
  then
    __DEBUG_COUNTER=$((__DEBUG_COUNTER+1))
    {
      # Prefix debug message with "bug (U+1F41B)"
      printf "🐛  %s " "${__DEBUG_COUNTER}"
      "${@}"
      printf "―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――\\n"
    } 1>&2
  fi
}
# debug()
#
# Usage:
#   debug "Debug info. Variable: $0"
#
# Print the specified message if the `$_USE_DEBUG` variable has been set.
#
# This is a shortcut for the _debug() function that simply echos the message.
debug() {
  _debug echo "${@}"
}

###############################################################################
# Die
###############################################################################

# _die()
#
# Usage:
#   _die printf "Error message. Variable: %s\n" "$0"
#
# A simple function for exiting with an error after executing the specified
# command. The command is expected to print a message and should typically
# be either `echo`, `printf`, or `cat`.
_die() {
  # Prefix die message with "cross mark (U+274C)", often displayed as a red x.
  printf "❌  "
  "${@}" 1>&2
  exit 1
}
# die()
#
# Usage:
#   die "Error message. Variable: $0"
#
# Exit with an error and print the specified message.
#
# This is a shortcut for the _die() function that simply echos the message.
die() {
  _die echo "${@}"
}

###############################################################################
# Help
###############################################################################

# _print_help()
#
# Usage:
#   _print_help
#
# Print the program help information.
_print_help() {
  cat <<HEREDOC

skale-dev-env main entry point

Usage:
  ${_ME} OPTIONS
  ${_ME} -? | --help

OPTIONS:

  --host -h  Local address to bind to (default: 0.0.0.0)
  --http-port  HTTP port to listen at (default: 1234 or use -1 to disable)
  --ws-port  WebSocket port to listen at (default: 1233 or use -1 to disable)
  --port -p  Same as --http-port
  
  -e --defaultBalanceEther  Amount of Ether to generate on schain owner's address (default: 100)
  -b --blockTime Interval of empty blocks generation (default: 3 sec or use -1 to disable)
  -? --help  Display this help information.

For transactions use the following account:

  Seed phrase: kidney describe moon museum join brave birth detect harsh little hockey turn
  Address: 0x6d80aAC61F6d92c7F4A3c412850474ba963B698E
  Private key: 0x16db936de7342b075849d74a66460007772fab88cf4ab509a3487f23398823d6
  
  Use chainId=0x54A7E

HEREDOC
}

# Parse Options ###############################################################

# Initialize program option variables.
_PRINT_HELP=0

if ((_USE_DEBUG))
then
  set -x
fi

# Initialize additional expected option variables.
_HOST="0.0.0.0"
_HTTP_PORT="1234"
_WS_PORT="1233"
_DEFAULT_BALANCE_ETHER="100"
_BLOCK_TIME="3"


# _require_argument()
#
# Usage:
#   _require_argument <option> <argument>
#
# If <argument> is blank or another option, print an error message and  exit
# with status 1.
_require_argument() {
  local _option="${1:-}"
  local _argument="${2:-}"

  if [[ -z "${_argument}" ]] || [[ "${_argument}" =~ ^-.*[^0-9] ]]
  then
    _die printf "Option requires an argument: %s\\n" "${_option}"
  fi
}

_require_argument_int() {
  local _option="${1:-}"
  local _argument="${2:-}"
  _require_argument $_option $_argument

  if [[ ! "${_argument}" =~ ^[+-]?[0-9]+$ ]]
  then
    _die printf "%s requires integer argument, got: %s\\n" "${_option}" "${_argument}"
  fi
}

while [[ ${#} -gt 0 ]]
do
  __option="${1:-}"
  __maybe_param="${2:-}"
  case "${__option}" in
    -\?|--help)
      _PRINT_HELP=1
      ;;
  -h|--host)
    _require_argument "${__option}" "${__maybe_param}"
    _HOST="${__maybe_param}"
    shift
    ;;
  -p|--port)
    _require_argument_int "${__option}" "${__maybe_param}"
    _HTTP_PORT="${__maybe_param}"
    shift
    ;;
  --http-port)
    _require_argument_int "${__option}" "${__maybe_param}"
    _HTTP_PORT="${__maybe_param}"
    shift
    ;;
  --ws-port)
    _require_argument_int "${__option}" "${__maybe_param}"
    _WS_PORT="${__maybe_param}"
    shift
    ;;
  -e|--defaultBalanceEther)
    _require_argument_int "${__option}" "${__maybe_param}"
    _DEFAULT_BALANCE_ETHER="${__maybe_param}"
    shift
    ;;
  -b|--blockTime)
    _require_argument_int "${__option}" "${__maybe_param}"
    _BLOCK_TIME="${__maybe_param}"
    shift
    ;;
  -*)
    _die printf "Unexpected option: %s\\n" "${__option}"
    ;;
  esac
  shift
done

###############################################################################
# Program Functions
###############################################################################

_json_replace(){
  local _what="$1"
  local _to="$2"
  local _where="$3"
  sed -i "s/${_what}[^,}]*/${_what}\": ${_to}/g" ${_where}
}

_print_params() {

  if [[ -n "${_HOST}" ]]
  then
    printf " --host=%s\n" "${_HOST}"
  fi

  if [[ -n "${_HTTP_PORT}" ]]
  then
    printf " --http-port=%s\n" "${_HTTP_PORT}"
  fi
  
  if [[ -n "${_WS_PORT}" ]]
  then
    printf " --ws-port=%s\n" "${_WS_PORT}"
  fi
  
  if [[ -n "${_DEFAULT_BALANCE_ETHER}" ]]
  then
    printf " --defaultBalanceEther=%s\n" "${_DEFAULT_BALANCE_ETHER}"
  fi
  
  if [[ -n "${_BLOCK_TIME}" ]]
  then
    printf " --blockTime=%s\n" "${_BLOCK_TIME}"
  fi
  
  printf "\n"

}

###############################################################################
# Main
###############################################################################
_main() {
  if ((_PRINT_HELP))
  then
    _print_help
    exit
  fi

  _print_params

  cp config.json.in config.json
  _json_replace emptyBlockIntervalMs "$((${_BLOCK_TIME}*1000))" config.json
  _json_replace '698E": {"balance' "\"${_DEFAULT_BALANCE_ETHER}000000000000000000\"" config.json

  if [[ -d "${_DATA_DIR}" ]]
  then
    printf "Found data_dir ${_DATA_DIR}\n"
    if ! diff "${_DATA_DIR}/config.json" config.json
    then
      printf "Re-creating blockchain in data_dir because of above config.json changes\n"
      rm -rf ${_DATA_DIR}/*
    else
      printf "Re-using existing blockchain\n"
    fi
  else
    mkdir "${_DATA_DIR}"
    printf "Creating data_dir ${_DATA_DIR}\n"
  fi

  mv config.json "${_DATA_DIR}/config.json"

  local _args_arr=""
  local _options=""
  if [[ "${_HTTP_PORT}" -gt  0 ]]
  then
    _args_arr="${_args_arr}	-p	${_HOST}:${_HTTP_PORT}:1234/tcp"
    _options="${_options} --http-port 1234"
  fi
  if [[ "${_WS_PORT}" -gt 0 ]]
  then
    _args_arr="${_args_arr}	-p	${_HOST}:${_WS_PORT}:1233/tcp"
    _options="${_options} --ws-port 1233"
  fi

  _options="${_options} --config /data_dir/config.json -d /data_dir"
  _options="${_options} --ipcpath /data_dir -v 3 --web3-trace --enable-debug-behavior-apis --aa no"

  docker pull ${_SKALED_IMAGE}

  docker run -v `pwd`/${_DATA_DIR}:/data_dir ${_args_arr} -e DATA_DIR=/data_dir -e OPTIONS="${_options}" --stop-timeout 40 -i -t ${_SKALED_IMAGE}

}

# Call `_main` after everything has been defined.
_main "$@"
