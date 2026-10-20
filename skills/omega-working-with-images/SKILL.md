---
name: omega-working-with-images
description: Use when you are about to read, download, screenshot, render or generate images or video frames, or when a tool result of yours will contain pictures. A model request that carries more than 30 MB of image content in total is refused, and every request resends every image still in your Session, so a Session that keeps looking at large images stops working. Covers the limit, how to look at many images without passing it, and what to do when a request has been refused.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Working With Images

## The model

Every time you answer, your whole Session is sent to the model again: your messages, your tool results and every image you looked at. The model's provider refuses a request whose images add up to more than 30 MB, with HTTP status 413 and the text `Downloaded image content cannot exceed 30MB`. A request of about 32 MB that carried eleven large images failed this way, and the Session it belonged to stopped answering.

The limit counts bytes, not tokens: a picture costs few tokens and many bytes, so a Session can be far below its context size and still be over the limit.

Images leave your Session only when it is compacted (summarised). Until then each one counts on every request.

## Rules

1. **Look at the smallest picture that answers the question.** Shrink first, then look. A screenshot or video frame rarely needs to be wider than 640 pixels to check a layout.
2. **Look at few.** Put several frames into one sheet and look at the sheet, not at each frame. Look at a single frame only when the sheet shows a fault.
3. **Do not look at the same picture twice.** A picture you have already looked at is still in your Session.
4. **Do a batch of checks on a worker, not in your Session.** When a job needs many pictures checked (every frame of a render), give the checking to a worker session (`omega-installing-software`) and ask for a text answer: which pictures failed, and why. The pictures then never enter your Session.
5. **Save what you will need before an image-heavy job.** Write results and decisions to a page in your notes (`omega-navigation`) as you go. If a Session stops, a new one can continue from the page.

## Commands

These need `ffmpeg` in the container. If `command -v ffmpeg` prints nothing, install it the way `omega-installing-software` says.

Shrink one picture to 640 pixels wide as a JPEG:

```
ffmpeg -loglevel error -y -i frame.png -vf scale=640:-1 -q:v 5 frame-640.jpg
```

Put the PNG files of a folder into one sheet, three across, each 320 pixels wide:

```
ffmpeg -loglevel error -y -pattern_type glob -i 'frames/*.png' -vf "scale=320:-1,tile=3x2" -frames:v 1 -q:v 5 sheet.jpg
```

`tile=3x2` fits six pictures. For more, raise the second number (`tile=3x4` fits twelve) or make several sheets.

## If a request has been refused

If a reply of yours ends with `Downloaded image content cannot exceed 30MB`, or your Session stops after you looked at images: do not look at more images in that Session. Tell the user what happened, give them what you saved on your notes page, and say that the work should continue in a new Session. Do not try to continue by looking at the same pictures again.
