FROM debian:stable-slim
RUN apt-get update && apt-get install -y make g++ libavformat-dev libavcodec-dev libavutil-dev git wget ca-certificates --no-install-recommends
RUN git clone https://github.com/anthwlock/untrunc.git
WORKDIR /untrunc
RUN make
ENTRYPOINT ["./untrunc"]
