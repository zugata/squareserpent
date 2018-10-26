FROM node:6

RUN npm install --global yarn && \
    mkdir /code
WORKDIR /code
ADD package.json yarn.lock /code/
RUN yarn install

ADD . /code
RUN yarn build

EXPOSE 8000
