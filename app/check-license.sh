#!/bin/sh

DISALLOW_LICENSES="GPL;GPL-2.0;GPL-3.0;LGPL;LGPL-3.0"

result=0
pnpm license-checker --failOn "$DISALLOW_LICENSES" >/dev/null || result=$?
if [[ ! "$result" = "0" ]]; then
    pnpm license-checker-rseidelsohn --csv
    exit 1
fi

exit 0
