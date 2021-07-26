from PIL import Image
import pytesseract
import cv2
import numpy as np  

k_r = 2
k_c = 2

# get grayscale image
def get_grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

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

img = cv2.imread('captcha2.jpg')
img = get_grayscale(img)
# cv2.imshow('get_grayscale', img)
# kernel = np.ones((2,2),np.uint8)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT  ,(2, 2))
img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
# cv2.imshow('morphologyEx', img)

# img = cv2.GaussianBlur(img,(5,5),0)
# cv2.imwrite('GaussianBlur.jpg',img)
cv2.imwrite('result.jpg',img)

# Wait for 'a' key to stop the program 
# cv2.waitKey(0)
  
# cv2.destroyAllWindows()
# img2 = cv2.imread('result copy.jpg',0)

text = pytesseract.image_to_string(img, lang='eng')
print(text)