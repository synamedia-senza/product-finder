# Product Finder
Recognizes products in the video and shows a map where you can buy them.

1. Takes a screenshot of the video
2. Uses OpenAI to detect the product in the picture
3. Uses IPData to get the location of the client IP address
4. Uses Google Maps to find the product in the current location
5. Shows the place on a map

### Usage

Press OK to search. 

The left and right arrows jump backwards and forwards by three seconds.

### Configuration

Create a `.env` file with these values:

```
IPDATA_API_KEY={IPData API key}
OPENAI_API_KEY={OpenAI API key}
GOOGLE_MAPS_API_KEY={Google Maps API key}
GOOGLE_MAP_ID={Google Maps Map ID}
````

You can get them from:

* [IPData API key|https://www.ipdata.co]
* [OpenAI API key|https://platform.openai.com/api-keysstyles]
* [Google Maps API key|https://developers.google.com/maps/documentation/javascript/get-api-key]
* [Google Maps Map ID|https://console.cloud.google.com/google/maps-apis/studio/styles]