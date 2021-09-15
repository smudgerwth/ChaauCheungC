#!/usr/bin/python
from PIL import Image
import pytesseract
import cv2
import numpy as np
import os

k_r = 2
k_c = 2
CAPTCHA_MIN_PIXEL = 5

FILE_NAME = "captcha30.jpg"
img = cv2.imread(os.path.join(
    os.path.dirname(__file__), "captcha\\"+FILE_NAME))
h, w, ch = img.shape
b = 3
img = img[b:h-b, b:w-b]

img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cv2.imwrite('grayscale.jpg', img)

(thresh, img) = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
cv2.imwrite('binary.jpg', img)

# kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(2, 2))
# ori_img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
# cv2.imwrite('close2.jpg',ori_img)

kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
cv2.imwrite('close3.jpg', img)

img = cv2.bitwise_not(img)


contours, hierarchy = cv2.findContours(
    img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
min_x, min_y = w, h
max_x = max_y = 0

poly = np.empty((0, 2), int)
blank_image = np.zeros((h-b-b, w-b-b, 1), np.uint8)

# computes the bounding box for the contour, and draws it on the frame,
for contour in (contours):
    (x, y, w, h) = cv2.boundingRect(contour)
    min_x, max_x = min(x, min_x), max(x+w, max_x)
    min_y, max_y = min(y, min_y), max(y+h, max_y)
    print("x,x,y,y", (min_x), (max_x), (min_y), (max_y))
    if w > CAPTCHA_MIN_PIXEL and h > CAPTCHA_MIN_PIXEL:
        cv2.rectangle(blank_image, (x-1, y-1),
                      (x+w-1, y+h-1), (255, 255, 255), 1)
        poly = np.append(
            poly, [[x-1, y-1], [x+w-1, y+h-1], [x-1, y+h-1], [x+w-1, y-1]], axis=0)

cv2.imwrite('rectangle.jpg', blank_image)

print((poly))
# if max_x - min_x > 0 and max_y - min_y > 0:
#     cv2.rectangle(img, (min_x, min_y), (max_x, max_y), (255, 0, 0), 2)

cv2.fillConvexPoly(blank_image, poly, (255, 255, 255))

contours, hierarchy = cv2.findContours(
    blank_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
print("len:", len(contours))
# print("contour:",(contours[3]))
# cv2.drawContours(img,contours,-1,(255,255,255),-1)
max_contour = max(contours, key=len)
rect = cv2.minAreaRect(max_contour)
box = cv2.boxPoints(rect)
box = np.int0(box)
cv2.drawContours(blank_image, [box], 0, (255, 255, 255), -1)
cv2.imwrite('mask.jpg', blank_image)


img = cv2.GaussianBlur(img, (3, 3), 0)
cv2.imwrite('ori_img.jpg', img)

print(blank_image.shape)
print(img.shape)
# ori_img = cv2.bitwise_not(ori_img)
result_img = cv2.bitwise_and(img, img, mask=blank_image)
# img = cv2.GaussianBlur(img,(5,5),0)
# cv2.imwrite('GaussianBlur.jpg',img)
cv2.imwrite('result_img.jpg', result_img)


def tesseract(src):
    custom_config = r'--oem 3 --psm 6 -l eng -c tessedit_char_whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvuwxyz1234567890+?#@&"'
    # custom_config = "--oem 3 --psm 6 -l eng -c tessedit_char_whitelist="
    # char_whitelist = "FfHhLlCcBbAa"
    # custom_config+=char_whitelist
    str = pytesseract.image_to_string(src, config=custom_config)
    print(str)


text = tesseract(result_img)
print(text)
