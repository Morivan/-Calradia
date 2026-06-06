# Draw.io Diagram Skill

Generate native `.drawio` files in mxGraphModel XML format.

## Critical Rules
- NEVER include XML comments (`<!-- -->`) in output
- Escape all special characters: `&amp;` `&lt;` `&gt;` `&quot;`
- Every edge MUST have a child `mxGeometry` element
- Every cell must have a unique `id`
- Root must always contain cells with `id="0"` and `id="1" parent="0"`

## Usage
`/drawio [description]` — generates a `.drawio` file and saves it to `docs/`

## Layout Guidelines
- Use `edgeStyle=orthogonalEdgeStyle` for clean right-angle routing
- Specify `exitX/exitY` and `entryX/entryY` to control edge attachment points
- Size boxes generously so text never overflows
- Use `html=1` and `&lt;br&gt;` for multi-line labels
- Separate parallel arrows by using different exitY/entryY values
- Wrap long text with `whiteSpace=wrap`
