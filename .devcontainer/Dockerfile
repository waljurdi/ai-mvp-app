FROM mcr.microsoft.com/devcontainers/universal:2

# Upgrade OpenSSL manually
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget build-essential checkinstall zlib1g-dev \
        libssl-dev ca-certificates && \
    wget https://www.openssl.org/source/openssl-3.3.0.tar.gz && \
    tar -xzvf openssl-3.3.0.tar.gz && \
    cd openssl-3.3.0 && \
    ./config && make -j$(nproc) && make install && \
    ldconfig && \
    openssl version

# Install Python packages
RUN pip install --upgrade pip setuptools wheel pymongo

# Clean up
RUN rm -rf /var/lib/apt/lists/* /openssl-3.3.0*

# Optional: Install MongoDB client tools if needed
