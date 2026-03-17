<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/drawingml/2006/main"
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                 xmlns:office="urn:schemas-microsoft-com:office:office"
                 xmlns:x="urn:schemas-microsoft-com:office:office:office"
                 xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
                 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
                 mc:Ignorable="dc"
                 mc:Ignorable="x14ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14ac"
                 mc:Ignorable="x14ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14ac"
                 mc:Ignorable="x14Ac"
                 mc:Ignorable="x14ac"
                 mc:Ignorable="x14ac"
                 mc:Ignorable="x14ac">
  <!-- ... -->
</p:presentation>

<!-- Slide Structure -->
<p:sld>
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>...</p:nvGrpSpPr>
      <p:grpSpPr>...</p:grpSpPr>
      <!-- Shapes go here -->
    </p:spTree>
  </p:cSld>
</p:sld>

<!-- Text Formatting -->
<a:r>
  <a:rPr>
    <a:lang val="en-US"/>
    <a:b val="0"/>
    <a:i val="0"/>
    <a:u val="none"/>
    <a:rFonts>
      <a:fontSize val="2400"/>
      <a:fontAscii val="Arial"/>
      <a:fontEastAsia val="Arial"/>
      <a:fontComplex script="jpn" val="Arial"/>
      <a:fontEastAsiaComplex script="kor" val="Arial"/>
    </a:rFonts>
    <a:solidFill>
      <a:srgbClr val="FFFFFF"/>
    </a:solidFill>
  </a:rPr>
  <a:t>Formatted text</a:t>
</a:r>

<!-- Lists -->
<a:p>
  <a:pPr>
    <a:lvl>
      <a:lvlText val=""/>
      <a:lvlJc>
        <a:lvlJc val="left"/>
      </a:lvlJc>
      <a:lvlIndent>
        <a:lvlIndent val="720"/>
      </a:lvlIndent>
      <a:lvlLeft>
        <a:lvlLeft val="720"/>
      </a:lvlLeft>
      <a:lvlRight>
        <a:lvlRight val="720"/>
      </a:lvlRight>
      <a:lvlDistance>
        <a:lvlDistance val="720"/>
      </a:lvlDistance>
    </a:lvl>
  </a:pPr>
  <a:r>
    <a:t>First item</a:t>
  </a:r>
</a:p>

<!-- Images -->
<p:pic>
  <p:nvPicPr>
    <p:cNvPr id="4" name="Picture">
      <a:hlinkClick r:id="" action="ppaction://media"/>
    </p:cNvPr>
    <p:cNvPicPr>
      <a:picLocks noChangeAspect="1"/>
    </p:cNvPicPr>
    <p:nvPr/>
  </p:nvPicPr>
  <p:blipFill>
    <a:blip r:embed="rId2"/>
    <a:stretch>
      <a:fillRect/>
    </a:stretch>
  </p:blipFill>
  <p:spPr>
    <a:xfrm>
      <a:off x="1000000" y="1000000"/>
      <a:ext cx="3000000" cy="2000000"/>
    </a:xfrm>
    <a:prstGeom prst="rect">
      <a:avLst/>
    </a:prstGeom>
  </p:spPr>
</p:pic>

<!-- Tables -->
<p:graphicFrame>
  <p:nvGraphicFramePr>
    <p:cNvPr id="5" name="Table"/>
    <p:cNvGraphicFramePr>
      <a:graphicFrameLocks noGrp="1"/>
    </p:cNvGraphicFramePr>
    <p:nvPr/>
  </p:nvGraphicFramePr>
  <p:xfrm>
    <a:off x="1000000" y="1000000"/>
    <a:ext cx="6000000" cy="2000000"/>
  </p:xfrm>
  <a:graphic>
    <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
      <a:tbl>
        <a:tblGrid>
          <a:gridCol w="3000000"/>
          <a:gridCol w="3000000"/>
        </a:tblGrid>
        <a:tr h="500000">
          <a:tc>
            <a:txBody>
              <a:bodyPr/>
              <a:lstStyle/>
              <a:p>
                <a:r>
                  <a:t>Cell 1</a:t>
                </a:r>
              </a:p>
            </a:txBody>
          </a:tc>
          <a:tc>
            <a:txBody>
              <a:bodyPr/>
              <a:lstStyle/>
              <a:p>
                <a:r>
                  <a:t>Cell 2</a:t>
                </a:r>
              </a:p>
            </a:txBody>
          </a:tc>
        </a:tr>
      </a:tbl>
    </a:graphicData>
  </a:graphic>
</p:graphicFrame>

<!-- Slide Layouts -->
<p:sp>
  <p:nvSpPr>
    <p:nvPr>
      <p:ph type="ctrTitle"/>
    </p:nvPr>
  </p:nvSpPr>
  <!-- Title content -->
</p:sp>

<p:sp>
  <p:nvSpPr>
    <p:nvPr>
      <p:ph type="subTitle" idx="1"/>
    </p:nvPr>
  </p:nvSpPr>
  <!-- Subtitle content -->
</p:sp>

<!-- Relationship Updates -->
<r:Relationships xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
</r:Relationships>

<!-- Slide IDs -->
<p:sldIdLst>
  <p:sldId id="256" r:id="rId2"/>
  <p:sldId id="257" r:id="rId3"/>
  <p:sldId id="258" r:id="rId4"/>
</p:sldIdLst>

<!-- docProps/app.xml -->
<Slides>2</Slides>
<Paragraphs>10</Paragraphs>
<Words>50</Words>

<!-- common errors to avoid -->
- **Encodings**: Escape unicode characters in ASCII content: `"` becomes `&#8220;`
- **Images**: Add to `ppt/media/` and update relationship files
- **Lists**: Omit bullets from list headers
- **IDs**: Use valid hexadecimal values for UUIDs
- **Themes**: Check all themes in `theme` directory for colors