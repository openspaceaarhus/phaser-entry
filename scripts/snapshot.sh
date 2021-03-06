#!/bin/bash

VERSION=$1 #git commit
NAME=$2    #Name the branch something more comprehensible

ROOT=../Buddinge-snapshots

#gulp
gulp_compile() {
    node node_modules/gulp/bin/gulp.js root compile
}

#checkout version
git checkout $VERSION

# perhaps create a name
if [[ -z "$NAME" ]]
then
    NAME=$(git log --pretty="%ci-%h-%s" -n 1 | sed 's/ /_/g' - )
fi

#if we are in scripts dir go back
cd ..

#compile
gulp_compile

#copy the build
DIR="$ROOT/$NAME"
mkdir -p $DIR
cp -R build/* $DIR

COMMENT=$(git log --pretty="%cd %aN %s" -n 1)

# make a note on som html
cat << EOF > $DIR/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Buddinge - Connecting the worlds (${VERSION})</title>
    <link href="game.css" rel="stylesheet"/>
</head>
<body>
<h1 style="color:#00FF00">${COMMENT}<h1>
<script src="phaser.js"></script>
<script src="game.js"></script>
</body>
</html>
EOF


#back to normal
git checkout master



