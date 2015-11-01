# Wall of Marvel

## What does it do?

When loading a new tab in the Chrome web browser, this extension will load twelve of Marvel's most recent comics.

## How does it work?

The front end is a very simple Chrome extension that only comprises of HTML and CSS - no Javascript. This was done to keep things simple.

On the back end is an Amazon Web Services (AWS) Lambda function that operates once every day. The AWS Lambda function, written in Javascript, has the job of fetching images from Marvel and stitching them together into a montage.

## What's next?

Below are some possibilities:

* Load the image asynchronously
* Give users the option to choose:
  * what comic covers to include or exclude
  * how often the image is refreshed
* A way to find out more about a particular comic

## Thanks

Thanks to Waylan Sands for helping me with designing the logo.

## Attribution

Data for this project has been provided by Marvel. © 2015 Marvel
