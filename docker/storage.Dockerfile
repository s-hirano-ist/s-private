FROM minio/minio:RELEASE.2024-10-29T16-01-48Z
CMD ["server", "/data", "--console-address", ":9001"]
