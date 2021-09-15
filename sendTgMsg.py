import requests
import sys
import os
import shutil
from pathlib import Path

TOKEN = '1914558215:AAHErOqjdG27dVSL_FLWwJVU7EkV-uC2b4E'
CHAT_ID = '-590113207'


def path(fn):
    return(os.path.join(os.path.dirname(os.path.abspath(__file__)), fn))


def sendTgMsg(msg):
    requests.post('https://api.telegram.org/bot'+TOKEN +
                  '/sendMessage?chat_id='+CHAT_ID+'&text='+msg)


msg = ''
# msg = sys.argv[1]
# msg = '佛光街體育館,15/09,22:00,1'
last_file = Path(path("last_result.csv"))
if last_file.is_file():
    print("last file exists")
    # with open(path('curr_result.csv'), 'w') as f:
    # f.write(msg)

    with open(path('last_result.csv'), 'r') as t1, open(path('curr_result.csv'), 'r') as t2:
        fileone = t1.readlines()
        filetwo = t2.readlines()

    diff = ""
    for line in filetwo:
        if line not in fileone:
            diff = diff+line
            # sendTgMsg(line)
    if(diff):
        sendTgMsg(diff)

    os.remove(path('last_result.csv'))
    shutil.copyfile(path('curr_result.csv'), path('last_result.csv'))
    # os.rename(path('curr_result.csv'),path('last_result.csv'))
else:
    print("no last_result")
    shutil.copyfile(path('curr_result.csv'), path('last_result.csv'))
    # with open(path('last_result.csv'), 'w') as f:
    # f.write(msg)
    with open(path('curr_result.csv'), 'r') as f:
        msg = f.read()
    sendTgMsg(msg)
