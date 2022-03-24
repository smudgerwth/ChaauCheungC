import requests
import time
import os
import shutil
import pandas as pd
from pathlib import Path

# TOKEN = '1914558215:AAHErOqjdG27dVSL_FLWwJVU7EkV-uC2b4E'
CHAT_ID_ALL = '-1001664412034'
CHAT_ID_HOLI = '-563254817'
CHAT_ID_WEEK = '-562433679'
CHAT_ID_HKI = '-760118570'
CHAT_ID_HKI2 = '-697240120'
CHAT_ID_NTW = '-682116111'
CHAT_ID_DEBUG = '166389413'

MSG_DELAY = 0

column_name = ["Date","Day","Holiday","Time","Venue"]

def path(fn):
    return(os.path.join(os.path.dirname(os.path.abspath(__file__)), fn))

with open(path('tgToken'), 'r') as f:
    TOKEN = f.read()

def sendTgMsg(msg,chat_id):
    requests.post('https://api.telegram.org/bot'+TOKEN +
                  '/sendMessage?chat_id='+chat_id+'&text='+msg)
    time.sleep(MSG_DELAY)

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

    # Send all diff
    msg = diff.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None)
    sendTgMsg(msg,CHAT_ID_ALL)

    # Send all NTW
    selVenue = ["青衣西南","楊屋道","荃灣西約"]
    NTW_diff = diff.query('Venue in @selVenue')
    if not NTW_diff.empty:
        sendTgMsg(NTW_diff.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None),CHAT_ID_NTW)

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

    #Send only weekday night, lunch 港灣道
    selVenue = ["港灣道"]
    selVenue2 = ["港灣道","小西灣","柴灣"]
    selTime = ["18:00","19:00","20:00","21:00","22:00"]
    selTime2 = ["07:00","13:00","18:00","19:00","20:00","21:00","22:00"]
    weekD_diff_HK = diff.query('Time in @selTime & Day in @selDay & Holiday=="N" & Venue in @selVenue')
    weekD_diff_HK2 = diff.query('Time in @selTime2 & Day in @selDay & Holiday=="N" & Venue in @selVenue2')
    if not weekD_diff_HK.empty:
        sendTgMsg(weekD_diff_HK.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None),CHAT_ID_HKI)    
    if not weekD_diff_HK2.empty:
        sendTgMsg(weekD_diff_HK2.drop(["Holiday"],axis=1).to_csv(sep = ',', index = False, header = None),CHAT_ID_HKI2)
else:
    print("no diff")

# Send debug msg
sendTgMsg('ping',CHAT_ID_DEBUG)
