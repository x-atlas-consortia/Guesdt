# Guesdt application
## Graphing UMLS Enables Search In Dynamic Trees

# Application architecture
Guesdt is a web application consisting of a HTML/JavaScript front end that calls REST endpoints of the [UBKG API](https://github.com/x-atlas-consortia/ubkg-api).

The application uses d3 visualization to represent subgraphs of a UBKG instance as dynamic trees.

Guesdt consists of the following files:
- **index.html**: the home page, which includes a user guide
- **Guesdt.html**: the main UI front end that works with the UBKG API
- **NivDemo.pdf** a screen capture of Guesdt in action

## Implementations

### GitHub Pages site

The Guesdt application is hosted as a GitHub Pages site at
https://x-atlas-consortia.github.io/Guesdt/

The GitHub Pages deployment is [here](https://github.com/x-atlas-consortia/Guesdt/settings/pages).

The source for the GitHub Pages deployment is in the _/docs_ folder.

### UBKGBox component (ubkg-guesdt)
Guesdt is a component of a **UBKGBox** multi-container application.

The Docker deployment consists of the following files:
- the **Dockerfile**
- the Docker Compose files
  - development-docker-compose.yml
  - docker-compose.yml
- The **build_ubkg-guesdt.sh** script
- the static files of the Guesdt application, located in the _ubkgbox_ folder
- **/conf/nginx.conf**: the configuration file for the web server