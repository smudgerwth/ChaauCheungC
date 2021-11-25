import requests
import sys
import os
import shutil
from pathlib import Path

# TOKEN = '1914558215:AAHErOqjdG27dVSL_FLWwJVU7EkV-uC2b4E'
CHAT_ID = '-682116111'


def path(fn):
    return(os.path.join(os.path.dirname(os.path.abspath(__file__)), fn))

with open(path('tgToken'), 'r') as f:
    TOKEN = f.read()

def sendTgMsg(msg):
    requests.post('https://api.telegram.org/bot'+TOKEN +
                  '/sendMessage?chat_id='+CHAT_ID+'&text='+msg)


sendTgMsg("test")
