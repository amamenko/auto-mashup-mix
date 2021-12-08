import os
import sys

os.system('replaygain -d {} {}'.format(sys.argv[1], sys.argv[2]))