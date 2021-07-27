from PIL import Image
import pytesseract
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


    
FILE_NAME = "captcha6.jpg"
img = cv2.imread(os.path.join(os.path.dirname(__file__), FILE_NAME))
h, w, ch = img.shape
b = 3
# img = img[b:h-b, b:w-b]

img = get_grayscale(img)
cv2.imwrite('grayscale.jpg',img)

img = grayscale_to_binary(img)
cv2.imwrite('binary.jpg',img)

# cv2.imshow('get_grayscale', img)
# kernel = np.ones((2,2),np.uint8)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(2, 2))
ori_img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
cv2.imwrite('close2.jpg',ori_img)


kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(3, 3))
img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
cv2.imwrite('close3.jpg',img)


# kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(3, 3))
# img = cv2.dilate(img, kernel, iterations = 1)
# kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(3, 3))
# img = cv2.erode(img, kernel, iterations = 1)
# cv2.imshow('morphologyEx', img)
img = cv2.bitwise_not(img)


contours, hierarchy = cv2.findContours(img,cv2.RETR_EXTERNAL ,cv2.CHAIN_APPROX_SIMPLE )
min_x, min_y = w, h
max_x = max_y = 0
# img = get_RGB(img)
l = len(contours)
print("len:"+str(l))
poly = np.empty((0,2),int)
# poly1 = np.empty((0,2),int)
# poly2 = np.empty((0,2),int)
# poly3 = np.empty((0,2),int)
# poly4 = np.empty((0,2),int)
# computes the bounding box for the contour, and draws it on the frame,
for contour in (contours):
    (x,y,w,h) = cv2.boundingRect(contour)
    min_x, max_x = min(x, min_x), max(x+w, max_x)
    min_y, max_y = min(y, min_y), max(y+h, max_y)
    print("x,x,y,y",(min_x),(max_x),(min_y),(max_y))
    cv2.rectangle(img, (x-1,y-1), (x+w-1,y+h-1), (255, 255, 255), 1)
    # poly1 = np.append(poly1,[[x,y]],axis=0)
    # poly2 = np.append(poly2,[[x+w,y+h]],axis=0)
    # poly3 = np.append(poly3,[[x,y+h]],axis=0)
    # poly4 = np.append(poly4,[[x+w,y]],axis=0)
    # poly = np.append(poly,[[[x,y],[x+w,y+h],[x,y+h],[x+w,y]]],axis=0)
    poly = np.append(poly,[[x-1,y-1],[x+w-1,y+h-1],[x-1,y+h-1],[x+w-1,y-1]],axis=0)
cv2.imwrite('rectangle.jpg',img)

# poly = poly[poly[:,0].argsort()]
print((poly))
# print((poly1))
# print((poly2))
# print((poly3))
# print((poly4))
# print(np.amin(poly1))
# print(np.argmax(poly,axis=0))
# print(np.argmin(poly,axis=0))
# rotrect = cv2.minAreaRect(poly)
# print((rotrect))
# if max_x - min_x > 0 and max_y - min_y > 0:
#     cv2.rectangle(img, (min_x, min_y), (max_x, max_y), (255, 0, 0), 2)

cv2.fillConvexPoly(img, poly, (255, 255, 255))
# img = get_grayscale(img)
# img = grayscale_to_binary(img)
contours, hierarchy = cv2.findContours(img,cv2.RETR_EXTERNAL ,cv2.CHAIN_APPROX_SIMPLE )
# img = get_RGB(img)

print("len:",len(contours)) 
# print("contour:",(contours[3])) 
# cv2.drawContours(img,contours,-1,(255,255,255),-1)  
max_contour = max(contours, key=len)
rect = cv2.minAreaRect(max_contour)
box = cv2.boxPoints(rect) # cv2.boxPoints(rect) for OpenCV 3.x
box = np.int0(box)
cv2.drawContours(img,[box],0,(255,255,255),-1)
cv2.imwrite('mask.jpg',img)


ori_img = cv2.GaussianBlur(ori_img,(3,3),0)
cv2.imwrite('ori_img.jpg',ori_img)

print(img.shape)
print(ori_img.shape)
ori_img = cv2.bitwise_not(ori_img)
result_img = cv2.bitwise_and(ori_img,ori_img,mask = img)
# img = cv2.GaussianBlur(img,(5,5),0)
# cv2.imwrite('GaussianBlur.jpg',img)
# cv2.imwrite('result.jpg',img)
cv2.imwrite('result_img.jpg',result_img)

# Wait for 'a' key to stop the program 
# cv2.waitKey(0)
  
# cv2.destroyAllWindows()
# img2 = cv2.imread('result copy.jpg',0)
def tesseract(src):
	custom_config = r'--oem 3 --psm 6 -l eng -c tessedit_char_whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvuwxyz1234567890+?#@&"'
	str = pytesseract.image_to_string(src, config=custom_config)
	print(str)

text = tesseract(result_img)
print(text)