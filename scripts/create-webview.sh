#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <component_name>"
    exit 1
fi

# Create .svelte file in ./webviews/components/
echo "<p>${1}</p>" > "../webviews/components/${1}.svelte"

# Create .ts file in ./webviews/pages/
echo "import App from \"../components/${1}.svelte\";

const app = new App({
    target: document.body
});

export default app;" > "../webviews/pages/${1}.ts"

echo "Files created successfully."

