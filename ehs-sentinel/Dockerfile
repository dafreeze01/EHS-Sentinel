ARG BUILD_FROM
FROM $BUILD_FROM

# Install Python and dependencies
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    gcc \
    musl-dev \
    && rm -rf /var/cache/apk/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application files
COPY src/ ./src/
COPY data/ ./data/
COPY tools/ ./tools/
COPY addon_ui/ /opt/ehs-sentinel-ui/

# Make run script executable
COPY run.sh .
RUN chmod a+x run.sh

# Expose ports for API and UI
EXPOSE 5000

CMD [ "./run.sh" ]