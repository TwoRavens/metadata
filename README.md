
Application to view and edit the metadata produced by the [TwoRavens preprocessing service](https://github.com/TwoRavens/raven-metadata-service).

# Install

1. git clone
2. cd metadata
3. npm install
4. npm install -g parcel-bundler
5. parcel index.html

# Uses

The TwoRavens preprocessing service creates a metadata file, `preprocess.json`, that describes the data that has been sent to our system. This file contains information about the data (e.g., the number of rows and columns) as well as information about the variables (e.g., roles, summary statistics, levels of measurement). The service also creates images that describe the data and variables. URIs to these images are stored in `preprocess.json`.

The purpose of this application is to allow users to view and customize their metadata. Users can revise values, add new information, submit customized graphics, and export a report (a structured codebook) that describes their data.

## Revising fields in preprocess

The following fields in `preprocess.json` may be edited by users:
  - numchar
  - nature
  - time
  - varnameTypes
  - labl

## Adding fields to preprocess

Users may add a new field in preprocess. For example, maybe there a dataset-level statistic that we have no included, or a column statistic that the user has created and wants to add to the metadata. User enters:
  - Name of new field
  - Value
  - Description of the field
  - Replication code (will not be executed) to recreate the statistic

## Adding graphics

Users may include graphics as part of their customized information about a dataset. These graphics may be uploaded through the editor, along with the following information:
  - Type of plot
  - Description
  - Replication code (will not be executed) to recreate the graphic
  - The variable(s) or data that the graphic is describing
  
We'll store these images and put the path in `preprocess.json`. You'll see the image in the editor/viewer.

## Display options

You may specify the variables, information about each variable, and images that you want to make visible to others.

## Generate reports

Users may export a report (in html or pdf) that resembles a codebook. This report that contains all information in `preprocess.json`, including anything the user has added, as well as all graphics that have been submitted to our system.
