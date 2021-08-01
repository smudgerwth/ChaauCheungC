#!/usr/bin/python
import cv2
import numpy as np  

k_r = 2
k_c = 2
min_pixel = 5

# get grayscale image
def get_grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def get_RGB(image):
    return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

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