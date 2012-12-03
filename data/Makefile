OGR ?= ogr2ogr -F GeoJSON
TOPOJSON ?= ../../topojson/bin/topojson --id-property name

all: \
	us-states.topojson \
	us-states-segmentized.topojson

us-states-segmentized.geojson: us-states.geojson
	$(OGR) -segmentize 0.5 $@ $<

us-states.topojson: us-states.geojson
	$(TOPOJSON) --simplify 24 -o $@ $<
	perl -pi -e "s/$</states/g" $@

us-states-segmentized.topojson: us-states-segmentized.geojson
	$(TOPOJSON) -o $@ $<
	perl -pi -e "s/$</states/g" $@

clean:
	rm -f us-states-segmentized.geojson
	rm -f *.topojson
