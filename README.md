# Guesdt application
## Graphing UMLS Enables Search In Dynamic Trees

# Application architecture
Guesdt is a web application consisting of a HTML/JavaScript front end that calls REST endpoints of the [UBKG API](https://github.com/x-atlas-consortia/ubkg-api).

The application uses d3 visualization to represent subgraphs of a UBKG instance as dynamic trees.

## Implementations

### GitHub Pages site

This is a standalone, HTML/JavaScript implementation of Guesdt.

The Guesdt application is hosted as a GitHub Pages site at
https://x-atlas-consortia.github.io/Guesdt/

The GitHub Pages deployment is [here](https://github.com/x-atlas-consortia/Guesdt/settings/pages).

#### Source
The GitHub Pages deployment of Guesdt consists of the following files:
- **index.html**: the home page, which includes a user guide
- **Guesdt.html**: the main UI front end that works with the UBKG API
- **NivDemo.pdf** a screen capture of Guesdt in action

Source files are in the _docs_ path of this repository.

### UBKGBox component (ubkg-guesdt)
Guesdt is integrated as a component of the **[UBKGBox](https://github.com/x-atlas-consortia/ubkg-box)** 
multi-container application architecture.

#### Source
The UBKGBox deployment of Guesdt consists of the following files:
- Docker-related files in the _docker_ directory
  - the **Dockerfile**
  - the Docker Compose files
    - development-docker-compose.yml
    - docker-compose.yml
  - the **build_ubkg-guesdt.sh** script
- the nginx configuration (in _nginx_ under the _docker_ path)
- the source of the Guesdt application, located in the _ubkgbox_ folder. 

The UBKGBox implementation refactors Guesdt for integration into UBKGBox:
1. The orginal **Guesdt.html** is moved to the fore and renamed **index.html**.
2. UMLS API authentication is removed. The **UBKGBox** reverse proxy manages authentication.
3. The remaining content of the original **index.html** page is renamed userguide.html.
4. Static resources, including the original **NivDemo.pdf**, spinners, and new logos, are moved to a _static_ subdirectory.
