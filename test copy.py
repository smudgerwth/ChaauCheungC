# import pytesseract
import cv2
import numpy as np
import os

def median_(src, x):
	return cv2.medianBlur(src, x)

# def tesseract(src):
# 	custom_config = r'--oem 3 --psm 6 -l eng -c tessedit_char_whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvuwxyz1234567890+?"'
# 	str = pytesseract.image_to_string(src, config=custom_config)
# 	print(str)


img = cv2.imread(os.path.join(os.path.dirname(__file__), 'captcha.jpg'))
cv2.imshow("hi",img)
#img = median_(img,3)

scale_percent = 1500
width = int(img.shape[1]*scale_percent/100)
height = int(img.shape[0]*scale_percent/100)
dim = (width, height)

resized = cv2.resize(img, dim,interpolation = cv2.INTER_AREA)
img2 = cv2.bitwise_not(resized)

kernel = np.ones((16, 16), np.uint8)
close = cv2.morphologyEx(img2, cv2.MORPH_OPEN, kernel)
newkernel = np.ones((3 , 3), np.uint8)
inv = cv2.erode(close, newkernel, iterations=2)
inv = cv2.bitwise_not(inv)
img_w = inv.shape[1]
img_h = inv.shape[0]
y=int(img_h/10)
h=int(img_h - img_h/5)
x=int(img_w/10)
w=int(img_w - img_w/5)
crop_img = inv[y:y+h, x:x+w]
cv2.imshow("inv",crop_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imwrite("crop_img5.png", crop_img)

# tesseract(crop_img)