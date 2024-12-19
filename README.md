# Guesdt application
## Graphing UMLS Enables Search In Dynamic Trees


# Application architecture
Guesdt is a web application consisting of a HTML/JavaScript front end that calls REST endpoints of the [UBKG API](https://github.com/x-atlas-consortia/ubkg-api).

The application uses d3 visualization to represent subgraphs of a UBKG instance as dynamic trees.

Guesdt consists of three files:
- **index.html**: the home page, which includes a user guide
- **Guesdt.html**: the main UI front end that works with the UBKG API
- **NivDemo.pdf** a screen capture of Guesdt in action


# Docker

As a web application, Guesdt requires a web server host. The Docker distribution of Guesdt builds a Docker container that includes 
a Nginx web server to host the application.

## Local Deployment instructions
1.  [Install Docker on the local machine](https://docs.docker.com/engine/install/).
2. Run the script **build_local.sh** to build a local Docker image named *guesdt-nginx*.
3. Run the script **run_local.sh** to build a local Docker container named *guesdt*.
4. In a Web browser, go to http://localhost:8080/index.html.

