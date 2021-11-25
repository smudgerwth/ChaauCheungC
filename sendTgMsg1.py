import requests
import sys
import os
import shutil
import pandas as pd
from pathlib import Path

# TOKEN = '1914558215:AAHErOqjdG27dVSL_FLWwJVU7EkV-uC2b4E'
CHAT_ID_ALL = '-590113207'
CHAT_ID_HOLI = '-563254817'
CHAT_ID_WEEK = '-562433679'
CHAT_ID_DEBUG = '166389413'

column_name = ["Date","Day","Holiday","Time","Venue"]

def path(fn):
    return(os.path.join(os.path.dirname(os.path.abspath(__file__)), fn))

with open(path('tgToken'), 'r') as f:
    TOKEN = f.read()

def sendTgMsg(msg,chat_id):
    requests.post('https://api.telegram.org/bot'+TOKEN +
                  '/sendMessage?chat_id='+chat_id+'&text='+msg)

msg = ''
diff = ''
curr_data = ''
last_data = ''

last_file = Path(path("last_result1.csv"))
curr_file = Path(path("curr_result1.csv"))
if last_file.is_file() and curr_file.is_file():
    print("last file exists")

    curr_data = pd.read_csv(path("curr_result1.csv"),names=column_name)
    last_data = pd.read_csv(path("last_result1.csv"),names=column_name)

    diff = pd.merge(last_data,curr_data, how='outer',indicator='Exist').sort_values(['Date','Time'])
    diff = diff.loc[diff['Exist'] == 'right_only'].drop(['Exist'],axis=1)

    os.remove(path('last_result1.csv'))
    shutil.copyfile(path('curr_result1.csv'), path('last_result1.csv'))

elif curr_file.is_file():
    print("no last_result")
    shutil.copyfile(path('curr_result1.csv'), path('last_result1.csv'))

    diff = pd.read_csv(path("curr_result1.csv"),names=column_name).sort_values(['Date','Time'])

else:
    print("Err: no curr_result")
    exit(1)

if not diff.empty:
    # Send debug msg
    msg = last_data.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None)
    sendTgMsg('LAST:',CHAT_ID_DEBUG)
    sendTgMsg(msg,CHAT_ID_DEBUG)

    msg = curr_data.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None)
    sendTgMsg('CURR:',CHAT_ID_DEBUG)
    sendTgMsg(msg,CHAT_ID_DEBUG)

    # Send all diff
    msg = diff.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None)
    sendTgMsg(msg,CHAT_ID_ALL)

    #Send only holiday
    selDay = ["六","日"]
    holi_diff = diff.query('Day in @selDay | Holiday=="H"')
    if not holi_diff.empty:
        sendTgMsg(holi_diff.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None),CHAT_ID_HOLI)
    
    #Send only weekday night
    selDay = ["一","二","三","四","五"]
    selTime = ["19:00","20:00","21:00","22:00"]
    weekD_diff = diff.query('Time in @selTime & Day in @selDay & Holiday=="N"')
    if not weekD_diff.empty:
        sendTgMsg(weekD_diff.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None),CHAT_ID_WEEK)
else:
    print("no diff")
