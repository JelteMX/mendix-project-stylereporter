mendix-project-stylereporter
===

This project was created in the Mendix Crafting Days and will help you determine which styles are used where. This is helpful when doing the styling of a project.

> Note: This is very experimental. It works, it is stable, but it is under heavy development. I might make a web-app out of it eventually.

## Installation

Make sure you use the LTS version of Node.js (8.x.x). Install the reporter (use ``-g`` to install it globally):

```bash
npm install mendix-project-stylereporter -g
```

## Usage

The reporter uses environment variables to run. You can set an environment variable while running the script:

```bash
MODEL_SDK_USER=jelte.lagendijk@mendix.com mendix-project-stylereporter
```

This will work, but the reporter uses a lot of variables. Another way is to use a ``.env`` file.

Just create a file called ``.env`` and fill it with the following variables:

```bash
# Credential
MODEL_SDK_USER=jelte.lagendijk@mendix.com
MODEL_SDK_TOKEN=xxxxxxx

# Project ID & Title are used to create a working copy
PROJECT_ID=xxxxxx
PROJECT_TITLE=Forum

# Providing a working copy will skip the get part
# WORKING_COPY=xxxxx

# Filter on a certain module
MODULE_NAME=''

# Other parts
VERBOSE=true
EXCEL_FILE=output/output.xlsx
JSON_FILE=output/output.json
```

The ``MODEL_SDK_TOKEN`` can be found in Sprintr, as well as the ``PROJECT_ID`` and ``PROJECT_TITLE``.

### Working copy

The first time you run this tool, you will not have a working copy. Based on the variables as set above, it will create one. This can take up to two minutes. Once this is done, it will tell you what the working copy id is. Copy this value and add it to the ``.env`` variable (Just uncomment **WORKING_COPY** and add the value)

### Output

Now that you have a working copy, it will give you a lot of output in the console (you can switch it off by setting **VERBOSE** to ``false``). It will also produce two files: Excel and JSON.

The Excel file will tell you what type of element with what name is on every page, including classnames and styles. It will also tell you which snippets and widgets are used.

The JSON file will tell you the same as Excel, with the exception of classes and styles. It does tell you which snippets and layouts are unused. It also gives you a full list of all the classnames that are used in the project.

## Development

This is developed using the Mendix Model SDK and Typescript. To do development, check out the repository and make sure you have the typescript compiler installed (``npm install tsc -g``). After you have installed the dependencies (``npm install``) you can run the compiler by running ``npm run build`` or ``npm run execute`` (this will do a build and execute the client)

## License

The MIT License (MIT)

Copyright (c) 2018 J.W. Lagendijk <jelte.lagendijk@mendix.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
