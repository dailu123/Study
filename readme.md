## Option 1: HUB -> GCS -> BigQuery

- Overview: Use GCP Java SDK to send CSV files directly from HUB to GCS, and then load files from GCS to BigQuery using Airflow.
- Advantages:
  - Direct transfer from HUB to GCP, saving time by eliminating intermediate transfer steps. Tests have shown that files as large as 5GB can be transferred to GCS within 5 minutes.
  - Minimal changes required to existing infrastructure. HUB only needs to replace the existing SFTP module with a call to the GCP Java package. Airflow only needs to add processing steps for loading files from GCS to BigQuery.
- Disadvantages:
  - Increases Airflow workload, requiring better processing capabilities. It's recommended to set up an Airflow cluster that can automatically scale up or down based on workload.


  