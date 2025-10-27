const rates = {
            Senior: { pp: 120, cash: 176400 },
            Advanced: { pp: 108, cash: 158760 },
            Early: { pp: 96, cash: 141120 }
        };

const expertLevelEl = document.getElementById('expert-level');
const monthsEl = document.getElementById('months');
const percentageEl = document.getElementById('percentage');
const costPpEl = document.getElementById('cost-pp');
const costCashEl = document.getElementById('cost-cash');

const currencyFormatter = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' });

function calculateCost() {
            const expertLevel = expertLevelEl.value;
            const months = parseFloat(monthsEl.value) || 0;
            const percentage = (parseFloat(percentageEl.value) || 0) / 100;
            
            const yearlyPP = rates[expertLevel].pp;
            const yearlyCash = rates[expertLevel].cash;
            
            const costPP = (yearlyPP * (months / 12) * percentage);
            const costCash = (yearlyCash * (months / 12) * percentage);

            costPpEl.innerText = costPP.toFixed(2);
            costCashEl.innerText = currencyFormatter.format(costCash).replace('CHF', 'CHF ');

            return { costPP, costCash, months, percentage: percentage * 100, expertLevel };
        }
        
        [expertLevelEl, monthsEl, percentageEl].forEach(element => {
            element.addEventListener('input', calculateCost);
        });

        document.addEventListener('DOMContentLoaded', calculateCost);

        // --- PDF Generation Logic ---
        const pdfToggle = document.getElementById('generate-pdf-toggle');
        const pdfFormContainer = document.getElementById('pdf-form-container');
        const pdfForm = document.getElementById('pdf-form-container');

        pdfToggle.addEventListener('change', () => {
            pdfFormContainer.classList.toggle('visible', pdfToggle.checked);
        });

        // Function to load image and convert to Base64, now also returns dimensions
        function getBase64Image(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve({ dataURL, width: img.width, height: img.height });
                };
                img.onerror = reject;
                img.src = url;
            });
        }

        pdfForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const { costPP, costCash, months, percentage, expertLevel } = calculateCost();
            const recipientName = document.getElementById('pdf-name').value;
            const institute = document.getElementById('pdf-institute').value;
            const street = document.getElementById('pdf-street').value;
            const city = document.getElementById('pdf-city').value;
            const project = document.getElementById('pdf-project').value || "Project";
            
            const today = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });

            try {
                const { dataURL: logoBase64, width: logoWidth, height: logoHeight } = await getBase64Image('assets/images/logo.png');

                const margin = 20;
                
                const aspectRatio = logoHeight / logoWidth;
                const logoDisplayWidth = 40; 
                const logoDisplayHeight = logoDisplayWidth * aspectRatio;
                const pageW = doc.internal.pageSize.getWidth();
                const logoX = pageW - margin - logoDisplayWidth;
                const logoY = 15;

                doc.addImage(logoBase64, 'PNG', logoX, logoY, logoDisplayWidth, logoDisplayHeight);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text("Data Science Lab", margin, 20);
                doc.text("University of Bern", margin, 25);
                doc.text("Muesmattstrasse 27", margin, 30);
                doc.text("3012 Bern", margin, 35);

                doc.text(institute, 120, 55);
                doc.text(recipientName, 120, 60);
                doc.text(street, 120, 65);
                doc.text(city, 120, 70);

                doc.text(`Bern, ${today}`, pageW - margin, 85, { align: 'right' });

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Offer for Personnel Costs: ${project}`, margin, 100);

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.text(`Dear ${recipientName}`, margin, 120);
                doc.text("We are pleased to offer the following resources for your project as described below:", margin, 130);

                const tableTop = 145;
                const tableRightEdge = pageW - margin;
                doc.setFont('helvetica', 'bold');
                doc.text("Description", margin, tableTop);
                doc.text("Total", tableRightEdge, tableTop, { align: 'right' });
                doc.line(margin, tableTop + 2, tableRightEdge, tableTop + 2);

                doc.setFont('helvetica', 'normal');
                const description = `Service costs for 1 ${expertLevel} Expert at ${percentage}% for ${months} month(s).`;
                const costText = currencyFormatter.format(costCash).replace('CHF', '').trim();
                doc.text(description, margin, tableTop + 10, { maxWidth: 130 });
                doc.text(costText, tableRightEdge, tableTop + 10, { align: 'right' });
                
                const ppDescription = `Associated Personnel Points (PP) for the duration.`;
                doc.text(ppDescription, margin, tableTop + 25, { maxWidth: 130 });
                doc.text(costPP.toFixed(2), tableRightEdge, tableTop + 25, { align: 'right' });

                doc.line(margin, tableTop + 32, tableRightEdge, tableTop + 32);
                doc.setFont('helvetica', 'bold');
                doc.text("Total (CHF)", margin, tableTop + 38);
                doc.text(costText, tableRightEdge, tableTop + 38, { align: 'right' });

                doc.setFont('helvetica', 'normal');
                doc.text("This offer is valid for 60 days.", margin, 220);
                doc.text("We are glad to support your project and look forward to your feedback.", margin, 230);

                doc.text("Best regards,", margin, 250);
                doc.text("Data Science Lab", margin, 260);

                doc.save(`Offer_DSL_${project.replace(/ /g, "_")}.pdf`);

            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Could not generate PDF. Make sure 'logo.png' is in the same folder and accessible.");
            }
        });
