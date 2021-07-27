from PIL import Image
# import pytesseract
import cv2
import numpy as np  
import os

k_r = 2
k_c = 2

# get grayscale image
def get_grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

def get_RGB(image):
    return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

def grayscale_to_binary(image):
    (thresh, im_bw) = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)
    return im_bw

# noise removal
def remove_noise(image):
    return cv2.medianBlur(image,3)
 
#thresholding
def thresholding(image):
    return cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

#dilation
def dilate(image):
    kernel = np.ones((k_r,k_c),np.uint8)
    return cv2.dilate(image, kernel, iterations = 1)
    
#erosion
def erode(image):
    kernel = np.ones((k_r,k_c),np.uint8)
    return cv2.erode(image, kernel, iterations = 1)

#opening - erosion followed by dilation
def opening(image):
    kernel = np.ones((k_r,k_c),np.uint8)
    return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)

#opening - dilation followed by erosion
def closing(image):
    kernel = np.ones((k_r,k_c),np.uint8)
    return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)

#canny edge detection
def canny(image):
    return cv2.Canny(image, 100, 200)

img = cv2.imread(os.path.join(os.path.dirname(__file__), 'captcha2.jpg'))
h, w, ch = img.shape
b = 3
img = img[b:h-b, b:w-b]

img = get_grayscale(img)
cv2.imwrite('grayscale.jpg',img)

img = grayscale_to_binary(img)
cv2.imwrite('binary.jpg',img)

# cv2.imshow('get_grayscale', img)
# kernel = np.ones((2,2),np.uint8)
# kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(2, 2))
# img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(3, 3))
img = cv2.dilate(img, kernel, iterations = 1)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(3, 3))
img = cv2.erode(img, kernel, iterations = 1)
# cv2.imshow('morphologyEx', img)

img = cv2.bitwise_not(img)

contours, hierarchy = cv2.findContours(img,cv2.RETR_EXTERNAL ,cv2.CHAIN_APPROX_SIMPLE )
min_x, min_y = w, h
max_x = max_y = 0
img = get_RGB(img)
l = len(contours)
print("len:"+str(l))
poly = np.empty((0,2),int)
# computes the bounding box for the contour, and draws it on the frame,
for contour in (contours):
    (x,y,w,h) = cv2.boundingRect(contour)
    min_x, max_x = min(x, min_x), max(x+w, max_x)
    min_y, max_y = min(y, min_y), max(y+h, max_y)
    print("x,x,y,y",(min_x),(max_x),(min_y),(max_y))
    # cv2.rectangle(img, (x,y), (x+w,y+h), (0, 255, 0), 2)
    poly = np.append(poly,[[x,y]],axis=0)
    poly = np.append(poly,[[x+w,y+h]],axis=0)
    poly = np.append(poly,[[x,y+h]],axis=0)
    poly = np.append(poly,[[x+w,y]],axis=0)
    # poly = np.append(poly,[x,y],[x+w,y+h],[x,y+h],[x+w,y])

print((poly))
rotrect = cv2.minAreaRect(poly)
print((rotrect))
# if max_x - min_x > 0 and max_y - min_y > 0:
#     cv2.rectangle(img, (min_x, min_y), (max_x, max_y), (255, 0, 0), 2)

cv2.fillConvexPoly(img, poly, (0, 0, 255))
# print("len:",len(contours)) 
# print("contour:",(contours[3])) 
# cv2.drawContours(img,contours,3,(255,0,0),0)  

# img = cv2.GaussianBlur(img,(5,5),0)
# cv2.imwrite('GaussianBlur.jpg',img)
cv2.imwrite('result.jpg',img)

# Wait for 'a' key to stop the program 
# cv2.waitKey(0)
  
# cv2.destroyAllWindows()
# img2 = cv2.imread('result copy.jpg',0)

# text = pytesseract.image_to_string(img, lang='eng')
# print(text)