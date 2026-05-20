FROM rust:1.86-slim
RUN apt-get update && apt-get install -y pkg-config protobuf-compiler clang make curl ca-certificates
RUN cargo install --locked linera-service@0.15.11 linera-storage-service@0.15.11
RUN ls -la /usr/local/cargo/bin/ > /binaries.txt
