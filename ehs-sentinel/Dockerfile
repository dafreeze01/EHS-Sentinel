ARG BUILD_FROM
FROM $BUILD_FROM

# Install Python and dependencies
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    && rm -rf /var/cache/apk/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application files
COPY src/ .
COPY data/ ./data/

# Make run script executable
COPY run.sh .
RUN chmod a+x run.sh

CMD [ "./run.sh" ]