FROM node:16

WORKDIR /usr/src/app



# # Install Azure CLI
# RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash



# # Set the default Azure subscription (optional)
# RUN az account set --subscription cf5a78fd-c66a-4b3b-83d3-1caad98a0e1c

# Log in to Azure using a service principal (replace with your authentication method)
#RUN az login --service-principal -u a0e911f1-821f-42a0-9fb5-9686d165b80b  -p R5~8Q~6V5F5ywzzS5xJSDTS1QFbRfGU2qPAFwawj --tenant ebd68952-e093-4f50-9e86-c85fbacae084
#  RUN az login
    



COPY package*.json ./

RUN npm install


COPY . .

EXPOSE 4000
CMD node app.js 
