<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:NotoEthiopic;src:url('{{ public_path('fonts/NotoSansEthiopic-Regular.ttf') }}') format('truetype');font-weight:400}@font-face{font-family:NotoEthiopic;src:url('{{ public_path('fonts/NotoSansEthiopic-Bold.ttf') }}') format('truetype');font-weight:700}@page{margin:34px 38px}body{font-family:NotoEthiopic,DejaVu Sans,sans-serif;color:#152128;font-size:10px;line-height:1.6}.cover{background:#07324A;color:#fff;padding:28px;border-radius:10px;margin-bottom:20px}.brand{font-size:11px;letter-spacing:2px;color:#F0C24C}.cover h1{font-size:24px;margin:20px 0 6px}.cover p{font-size:12px;color:#EAF1F5}.pill{display:inline-block;background:#FCF5E3;color:#07324A;padding:4px 9px;border-radius:12px;margin:2px}h2{font-size:16px;color:#07324A;border-bottom:2px solid #DDA822;padding-bottom:5px;margin-top:20px}.box{background:#EAF1F5;border-left:4px solid #07324A;padding:10px 12px;margin:10px 0}.warning{background:#FCF5E3;border-left-color:#DDA822}table{width:100%;border-collapse:collapse;margin:8px 0 16px}th{background:#07324A;color:#fff;text-align:left;padding:7px}td{border:1px solid #D8E0E9;padding:6px;vertical-align:top}tr:nth-child(even) td{background:#F5F7FA}.req{color:#CA2B2B;font-weight:bold}.opt{color:#2C9664;font-weight:bold}.page{page-break-before:always}.footer{position:fixed;bottom:-22px;right:0;color:#4F6672;font-size:8px}
</style></head><body><div class="footer">ALEF DELTA · የሠራተኛ ኢምፖርት መመሪያ · {{ now()->format('Y-m-d') }}</div>
<div class="cover"><div class="brand">ALEF DELTA ERP</div><h1>የሠራተኛ Excel እና CSV ኢምፖርት</h1><p>መደበኛ ቅጽ፣ የኢትዮጵያና የጎርጎርዮሳዊ ቀን፣ ድግግሞሽ መከላከያ እና በየረድፉ የስህተት ሪፖርት።</p></div>
<div><span class="pill">XLSX</span><span class="pill">XLS</span><span class="pill">CSV</span><span class="pill">EC + GC</span><span class="pill">በየረድፉ ማረጋገጫ</span></div>
<h2>ፈጣን የአጠቃቀም ደረጃዎች</h2><table><tr><th>ደረጃ</th><th>ተግባር</th></tr><tr><td>1</td><td><b>employee_import_template.xlsx</b> ይክፈቱ፤ header አይቀይሩ።</td></tr><tr><td>2</td><td>በእያንዳንዱ ረድፍ አንድ ሠራተኛ ያስገቡ። የስልክ ቁጥር መጀመሪያ 0 እንዳይጠፋ ሴሉን Text ያድርጉ።</td></tr><tr><td>3</td><td>Employees → <b>Import Excel</b> ይሂዱ፣ default category እና calendar ይምረጡና ፋይሉን ይጫኑ።</td></tr><tr><td>4</td><td>CREATED፣ UPDATED፣ UNCHANGED እና ERROR የሚሉትን የየረድፉ ውጤቶች ይመልከቱ።</td></tr></table>
<div class="box"><b>የቆየ ፋይል ድጋፍ፦</b> <b>Name</b>፣ <b>Phone</b> እና <b>Hired Date</b> የሚሉ header ያላቸው ፋይሎች ይቀበላሉ። ሙሉ ስም ከመጀመሪያው ክፍተት ላይ ይከፈላል።</div>
<h2>የአምዶች መመሪያ</h2><table><tr><th style="width:20%">አምድ</th><th style="width:12%">መስፈርት</th><th>መግለጫ</th></tr>
@foreach([
['employee_code','አማራጭ','ያለ ሠራተኛ ለማዘመን ይመከራል። የስልክ ቁጥርን በደህንነት ለመቀየር ያስችላል፤ ለአዲስ ሠራተኛ ባዶ ይተዉት።'],
['first_name','ግዴታ','የሠራተኛው መጠሪያ ስም። በምትኩ Name የሚል ሙሉ ስም መጠቀም ይቻላል።'],
['last_name','አማራጭ','የአባት/ቀሪ ስም።'],
['email','አማራጭ','ትክክለኛና ያልተደገመ email። ባዶ ከሆነ የERP login email ይፈጠራል።'],
['phone_number','ግዴታ','09XXXXXXXX ወይም +2519XXXXXXXX። 09 በራስ-ሰር +251 ሆኖ ይቀመጣል።'],
['status','አማራጭ','ACTIVE፣ PROBATION፣ INACTIVE ወይም TERMINATED። ባዶ ከሆነ ACTIVE።'],
['category','አማራጭ','ትክክለኛ category name/code/ID። ባዶ ከሆነ በupload window የተመረጠውን ይጠቀማል።'],
['hire_date','አማራጭ','EC: DD/MM/YYYY ወይም DD/MM/YY። GC: YYYY-MM-DD ወይም DD/MM/YYYY። ባዶ ከሆነ የኢምፖርቱ ቀን።'],
['date_calendar','አማራጭ','EC ወይም GC። ባዶ ከሆነ በupload window የተመረጠውን ይጠቀማል።']
] as $field)<tr><td><b>{{ $field[0] }}</b></td><td class="{{ $field[1]==='ግዴታ'?'req':'opt' }}">{{ $field[1] }}</td><td>{{ $field[2] }}</td></tr>@endforeach</table>
<div class="page"></div><h2>የቀን ሕጎች</h2><table><tr><th>Calendar</th><th>ምሳሌ</th><th>በሲስተም የሚቀመጠው</th></tr><tr><td><b>EC</b></td><td>10/01/2016፣ 10/01/16 ወይም 04/13/2018።</td><td>ተረጋግጦ ወደ ተመጣጣኙ የጎርጎርዮሳዊ ቀን ይቀየራል።</td></tr><tr><td><b>GC</b></td><td>2026-09-21 ወይም 21/09/2026።</td><td>በዚያው የጎርጎርዮሳዊ ቀን ይቀመጣል።</td></tr></table>
<h2>ውጤት እና የማዘመን ደህንነት</h2><div class="box"><b>CREATED፦</b> ሠራተኛውና login account ተፈጥረዋል።<br><b>UPDATED፦</b> ያለው ሠራተኛ ተገኝቶ የተቀየሩ መረጃዎች ብቻ ተዘምነዋል፤ password አልተቀየረም።<br><b>UNCHANGED፦</b> ሠራተኛው ቀድሞ አለ እና መረጃው አልተቀየረም።<br><b>ERROR፦</b> ያ ረድፍ ብቻ አይገባም፤ የተሳሳተው አምድና ዋጋ ይታያል፤ ሌሎች ትክክለኛ ረድፎች ይቀጥላሉ።<br><b>EMPTY፦</b> ባዶ ረድፎች ይታለፋሉ።</div>
<h2>የመግቢያ መረጃ</h2><p>ውጤቱ Employee ID እና የመጀመሪያ password ያሳያል። Password = <b>Employee ID-የስልኩ መጨረሻ 4 ቁጥሮች</b>፣ ለምሳሌ <b>EMP00123-4567</b>።</p>
<h2>የተለመዱ ስህተቶች</h2><table><tr><th>ስህተት</th><th>መፍትሔ</th></tr><tr><td>Missing required columns</td><td>መደበኛ template ወይም Name/Phone header ይጠቀሙ።</td></tr><tr><td>Invalid Ethiopian mobile number</td><td>09 ከ8 ቁጥሮች ጋር ወይም +2519 ከ8 ቁጥሮች ጋር ይጠቀሙ።</td></tr><tr><td>Category was not found</td><td>Jobs → Manage Categories ውስጥ ያለ category ይምረጡ።</td></tr><tr><td>Invalid EC date</td><td>ቀን/ወር ቅደም ተከተል ያረጋግጡ፤ ጳጉሜ ወር 13 ነው።</td></tr></table>
<div class="warning box"><b>አስፈላጊ፦</b> ሁሉም ERROR እስኪስተካከሉ የውጤት ሪፖርቱን ያስቀምጡ። ያለ ስልክ ድግግሞሽ እንደገና መጫን ደህና ነው።</div></body></html>
