This project is designed to enable browser based (typically webrtc) applications to stream to an rtmp destination. Initially built to join Chime Meetings and stream to IVS.


```
export REGION=us-west-2
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 371589772270.dkr.ecr.us-west-2.amazonaws.com

aws ecr create-repository --repository-name kaleidoscope --image-scanning-configuration scanOnPush=true --region us-west-2

docker tag kaleidoscope:latest 371589772270.dkr.ecr.us-west-2.amazonaws.com/kaleidoscope:latest

docker push 371589772270.dkr.ecr.us-west-2.amazonaws.com/kaleidoscope:latest
```

Usage
-----
run task with environment variables:
BROWSER_URL=https://foo.null.com|app|mic|speaker
BROWSER2_URL=https://foo.null.com|app|mic|speaker
RTMP_URL=rtmps://bar|input

Specific to Chime Meeting bot : 
MEETING_PARTICIPANT_NAME=My display name
Specific to Connect agent :
SITE_AUTH_foo_null_com=user:password