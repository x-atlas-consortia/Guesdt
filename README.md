# Guesdt application
## Graphing UMLS Enables Search In Dynamic Trees


# Application architecture
Guesdt is a web application consisting of a HTML/JavaScript front end that calls REST endpoints of the [UBKG API](https://github.com/x-atlas-consortia/ubkg-api).

The application uses d3 visualization to represent subgraphs of a UBKG instance as dynamic trees.

Guesdt consists of the following files:
- **index.html**: the home page, which includes a user guide
- **Guesdt.html**: the main UI front end that works with the UBKG API
- **NivDemo.pdf** a screen capture of Guesdt in action


# Docker

As a web application, Guesdt requires a web server host. The Docker distribution of Guesdt builds a Docker container that includes 
a Nginx web server to host the application.

The Docker deployment consists of the following files:
- the **Dockerfile**
- the static files of the Guesdt application
- **/conf/nginx.conf**: the configuration file for the web server
- **build_local.sh**: a shell script that builds a local Docker image named *guesdt-nginx*
- **run_local.sh**: a shell script that builds a local Docker container named *guesdt*

## Local Deployment instructions

1.  [Install Docker on the local machine](https://docs.docker.com/engine/install/).
2. Run **build_local.sh**.
3. Run **run_local.sh**.
4. In a Web browser, go to http://localhost:8080/index.html.

