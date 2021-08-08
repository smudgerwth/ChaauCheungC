#!/usr/bin/python
import pytesseract
import cv2
import numpy as np  
import os
import sys
import base64
import io

def path(fn):
    return(os.path.join(os.path.dirname(os.path.abspath(__file__)),fn))

def writeimg(fn,img):
    cv2.imwrite(path(fn), img)

MORPH_RECT_SIZE = 2
CAPTCHA_MIN_PIXEL_W = 2
CAPTCHA_MIN_PIXEL_H = 5

data = sys.argv[1]
char_list = sys.argv[2]
# data="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"
# char_list = "ABCD"

# FILE_NAME = "captcha.jpg"
# img = cv2.imread(path(FILE_NAME))
im_bytes = base64.b64decode(data)
im_arr = np.frombuffer(im_bytes, dtype=np.uint8)  # im_arr is one-dim Numpy array
img = cv2.imdecode(im_arr, flags=cv2.IMREAD_COLOR)
writeimg('captcha.jpg',img)
h, w, ch = img.shape
b = 3
img = img[b:h-b, b:w-b]

img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
writeimg('grayscale.jpg',img)

(thresh, img) = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
writeimg('binary.jpg',img)

# kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(2, 2))
# ori_img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
# writeimg('close2.jpg',ori_img)

kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(MORPH_RECT_SIZE, MORPH_RECT_SIZE))
img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
writeimg('close3.jpg',img)

img = cv2.bitwise_not(img)


contours, hierarchy = cv2.findContours(img,cv2.RETR_EXTERNAL ,cv2.CHAIN_APPROX_SIMPLE )
min_x, min_y = w, h
max_x = max_y = 0

poly = np.empty((0,2),int)
blank_image = np.zeros((h-b-b,w-b-b,1), np.uint8)

# computes the bounding box for the contour, and draws it on the frame,
for contour in (contours):
    (x,y,w,h) = cv2.boundingRect(contour)
    min_x, max_x = min(x, min_x), max(x+w, max_x)
    min_y, max_y = min(y, min_y), max(y+h, max_y)
    # print("x,x,y,y",(min_x),(max_x),(min_y),(max_y))
    if w > CAPTCHA_MIN_PIXEL_W and h > CAPTCHA_MIN_PIXEL_H:
        cv2.rectangle(blank_image, (x-1,y-1), (x+w-1,y+h-1), (255, 255, 255), 1)
        poly = np.append(poly,[[x-1,y-1],[x+w-1,y+h-1],[x-1,y+h-1],[x+w-1,y-1]],axis=0)

writeimg('rectangle.jpg',blank_image)

# print((poly))
# if max_x - min_x > 0 and max_y - min_y > 0:
#     cv2.rectangle(img, (min_x, min_y), (max_x, max_y), (255, 0, 0), 2)

cv2.fillConvexPoly(blank_image, poly, (255, 255, 255))

contours, hierarchy = cv2.findContours(blank_image,cv2.RETR_EXTERNAL ,cv2.CHAIN_APPROX_SIMPLE )
# print("len:",len(contours)) 
# print("contour:",(contours[3])) 
# cv2.drawContours(img,contours,-1,(255,255,255),-1)  
max_contour = max(contours, key=len)
rect = cv2.minAreaRect(max_contour)
box = cv2.boxPoints(rect)
box = np.int0(box)
cv2.drawContours(blank_image,[box],0,(255,255,255),-1)
writeimg('mask.jpg',blank_image)


img = cv2.GaussianBlur(img,(3,3),0)
writeimg('ori_img.jpg',img)

# print(blank_image.shape)
# print(img.shape)
# ori_img = cv2.bitwise_not(ori_img)
result_img = cv2.bitwise_and(img,img,mask = blank_image)
# img = cv2.GaussianBlur(img,(5,5),0)
# writeimg('GaussianBlur.jpg',img)
writeimg('result_img.jpg',result_img)

# custom_config = r'--oem 3 --psm 6 -l eng -c tessedit_char_whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvuwxyz1234567890+?#@&"'
custom_config = "--oem 3 --psm 6 -l eng -c tessedit_char_whitelist="
# char_whitelist = "FfHhLlCcBbAa"
custom_config+="\""+char_list+"\""
# print(custom_config)
str = pytesseract.image_to_string(result_img, config=custom_config)
print(str)
